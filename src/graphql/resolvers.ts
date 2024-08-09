import { GraphQLError } from "graphql";
import processImage from "../processImage";
import { Worker, Queue } from "bullmq";
import redis from "ioredis";
import mongoose from "mongoose";
import Request from "../db/requestModel";
import { generateUploadURL } from "../oStorageConfig";
import User from "../db/userModel";
import Log from "../db/logs";
import { CloudWatchLogs } from "aws-sdk";

// const connection = new redis({
//   host: "localhost",
//   port: 6379,
// });

type uploadRequestInput = {
  info: {
    name: string;
    email: string;
  };
};
type createRequestInput = {
  request: {
    userId: string;
    images: [string];
    borderColor: string;
    verticalOrHorizontal: string;
    borderSize: number;
  };
};
const resolvers = {
  Query: {},
  Mutation: {
    uploadRequest: async (_: any, arg: uploadRequestInput) => {
      let presign;
      let user;
      try {
        presign = await generateUploadURL();
        user = await User.findOne({ email: arg.info.email });
        if (!user) {
          user = await User.create({
            name: arg.info.name,
            email: arg.info.email,
          });
        }
        user.uploadUrl = presign;
        await user.save();
        return user;
      } catch (err) {
        console.log(err);
        throw new GraphQLError("Unexpected error");
      }
    },
    collageRequest: async (_: any, arg: createRequestInput) => {
      let request;
      type Request = {
        images: [String];
      };
      interface User extends mongoose.Document {
        requests: [Request];
      }
      try {
        const user = (await User.findById(arg.request.userId).populate({
          path: "requests",
        })) as User;
        const images = user.requests.flatMap((request) => request.images);
        request = await Request.create({
          user: arg.request.userId,
          borderColor: arg.request.borderColor,
          borderSize: arg.request.borderSize,
          images: arg.request.images,
          state: "Pending",
        });
        const queue = await addQueue(user.id);
        queue.on("waiting",async (job)=>{
          await Log.create({
            request:job.id
            ,message:`process added to the wait list`
          })
        })
        await queue.add("imageProcess", {
          images: arg.request.images,
          borderSize: arg.request.borderSize,
          borderColor: arg.request.borderColor,
          verticalOrHorizontal: arg.request.verticalOrHorizontal,
        },{jobId:request.id});
        return request;
      } catch (err) {
        const error = err as GraphQLError;
        if (error.extensions.Operational) {
          throw new GraphQLError(error.message);
        } else {
          console.log(err);
          throw new GraphQLError("Unexpected error");
        }
      }
    },
  },
};
const queues = new Map();
const addQueue = async (userId: string):Promise<Queue<any, any, string>> => {
  try {
    if (!queues.has(userId)) {
      const userQueue = new Queue(`process ${userId}`, {
        connection: {
          host: "localhost",
          port: 6379,
        },
      });

      const userWorker = new Worker(
        `process ${userId}`,
        async (job) => {
          await processImage(
            job.id!,
            job.data.images,
            job.data.borderSize,
            job.data.borderColor,
            job.data.verticalOrHorizontal
          );
        },
        {
          connection: {
            host: "localhost",
            port: 6379,
          },
        }
      );
      userWorker.on("active", async (job) => {
        await Log.create({
          message: `procces starts ${Date.now()}`,
        });
      });
      userWorker.on("progress", async (job) => {
        await Log.create({
          message: `procces in progress ${Date.now()}`,
        });
      });
      userWorker.on("completed", async (job) => {
        await Request.findByIdAndUpdate(job.id,{
          state:'Successfull'
        })
        await Log.create({
          message: `procces completed ${Date.now()}`,
        });
      });
      userWorker.on("failed", async (job,err)=> {
        await Request.findByIdAndUpdate(job!.id,{
          state:'Failed'
        })
        const error=err as GraphQLError
        let cause='Unexpected error'
        if(error.extensions.Operational){
          cause=error.message
        }
        await Log.create({
          event: "failed",
          message: `procces failed cause: ${cause} ${Date.now()}`,
        });
      });

      queues.set(userId, userQueue);
    }
    return queues.get(userId);
  } catch (err) {
    const error = err as Error;
    throw new GraphQLError(error.message, {
      extensions: {
        Operational: true,
      },
    });
  }
};
export default resolvers;
