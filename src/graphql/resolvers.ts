import { GraphQLError } from "graphql";
import processImage from "../processImage";
import { Worker, Queue } from "bullmq";
import Request from "../db/requestModel";
import { generatePresignedURL } from "../oStorageConfig";
import User from "../db/userModel";
import Log from "../db/logsModel";

type uploadRequestInput = {
  info: {
    name: string;
    email: string;
  };
};
type createRequestInput = {
  request: {
    email: string;
    userId: string;
    images: [string];
    borderColor: string;
    verticalOrHorizontal: string;
    borderSize: number;
  };
};
const resolvers = {
  Query: {
    showMyRequests: async (_: any, arg: { email: string }) => {
      try {
        const requests = await Request.find({ userEmail: arg.email });
        return requests;
      } catch (err) {
        const error = err as GraphQLError;
        throw new GraphQLError(error.message);
      }
    },
    showRequestLog: async (_: any, arg: { request: string }) => {
      try {
        const logs = await Log.find({ request: arg.request });
        return logs;
      } catch (err) {
        const error = err as GraphQLError;
        throw new GraphQLError(error.message);
      }
    },
    showOneRequest: async (_: any, arg: { request: string }) => {
      try {
        const request = await Request.findById(arg.request);
        return request;
      } catch (err) {
        const error = err as GraphQLError;
        throw new GraphQLError(error.message);
      }
    },
  },
  Mutation: {
    cancelRequest: async (_: any, arg: { request: string }) => {
      try {
        const request = await Request.findById(arg.request);
        if (request?.state != "Pending" || !request) {
          throw new GraphQLError(
            "Request is either completed or does not exists",
            {
              extensions: {
                Operational: true,
              },
            }
          );
        }
        const queue = await addOrGetQueue(request.userEmail!);
        
        
        queue.remove(arg.request);
        await Log.create({
          request: arg.request,
          message: `process removed at: ${Date.now()}`,
        });
        await Request.findByIdAndUpdate(arg.request,{
          state:"Cancelled"
        })
        return "Job successfully removed";
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
    uploadRequest: async (_: any, arg: uploadRequestInput) => {
      let presign;
      let user;
      try {
        presign = await generatePresignedURL("upload");
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
      try {
        const user = await User.findOne({ email: arg.request.email });
        if (!user) {
          throw new GraphQLError("You Should submit a upload request first", {
            extensions: {
              Operational: true,
            },
          });
        }
        request = await Request.create({
          userEmail: arg.request.email,
          borderColor: arg.request.borderColor,
          borderSize: arg.request.borderSize,
          images: arg.request.images,
          state: "Pending",
        });
        const queue = await addOrGetQueue(user.email!);
        await queue.add(
          "imageProcess",
          {
            images: arg.request.images,
            borderSize: arg.request.borderSize,
            borderColor: arg.request.borderColor,
            verticalOrHorizontal: arg.request.verticalOrHorizontal,
          },
          { jobId: request.id}
        );
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
const addOrGetQueue = async (
  email: string
): Promise<Queue<any, any, string>> => {
  try {
    if (!queues.has(email)) {
      const userQueue = new Queue(`process ${email}`, {
        connection: {
          host: "localhost",
          port: parseInt(process.env.REDIS_PORT!),
        },
      });
      userQueue.on("waiting", async (job) => {
        await Log.create({
          request: job.id,
          message: `process added to the wait list at: ${Date.now()}`,
        });
      });
      userQueue.on("removed", async (job) => {
        await Log.create({
          request: job.id,
          message: `process removed at: ${Date.now()}`,
        });
      });
      const userWorker = new Worker(
        `process ${email}`,
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
            port: parseInt(process.env.REDIS_PORT!),
          },
        }
      );
      userWorker.on("active", async (job) => {
        await Log.create({
          request: job.id,
          message: `procces starts at: ${Date.now()}`,
        });
      });
      userWorker.on("completed", async (job) => {
        await Request.findByIdAndUpdate(job.id, {
          state: "Successfull",
          link: await generatePresignedURL("Download", job.id),
        });
        await Log.create({
          request: job.id,
          message: `procces completed at: ${Date.now()}`,
        });
      });
      userWorker.on("failed", async (job, err) => {
        await Request.findByIdAndUpdate(job!.id, {
          state: "Failed",
        });
        const error = err as GraphQLError;
        let cause = "Unexpected error";
        if (error.extensions.Operational) {
          cause = error.message;
        }
        await Log.create({
          request: job!.id,
          message: `procces failed cause: ${cause}  at: ${Date.now()}`,
        });
      });

      queues.set(email, userQueue);
    }
    return queues.get(email);
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
