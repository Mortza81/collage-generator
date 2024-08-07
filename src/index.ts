import express from "express";
import {graphql, GraphQLError} from "graphql";
import processImage from "./processImage";
import { createSchema, createYoga } from "graphql-yoga";
import mongoose from "mongoose";
import Request from "./db/requestModel";
import { generateUploadURL, upload } from "./oStorageConfig";
import dotenv from "dotenv";
import User from "./db/userModel";
dotenv.config();
const app = express();

const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type Query {
      uploadRequest: String
    }
    type Mutation {
      collageRequest(request: createRequestInput!): Request
      uploadRequest(info: uploadRequestInput!): User
    }
    type User {
      name: String
      email: String
      id: ID
      uploadUrl: String
    }
    input uploadRequestInput {
      name: String!
      email: String!
    }
    input createRequestInput {
      userId: String!
      images: [String]!
      borderColor: String!
      verticalOrHorizontal: String!
      borderSize: Int!
    }
    type Request {
      images: String
      borderColor: String
      verticalOrHorizontal: String
      borderSize: String
      state: String
    }
  `,
  resolvers: {
    Query: {},
    Mutation: {
      uploadRequest: async (_, arg) => {
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
            throw new GraphQLError('Unexpected error')
        }
      },
      collageRequest: async (_, arg) => {
        let request;
        type Request={
          images:[String]
        }
        interface User extends mongoose.Document {
          requests: [Request]
        }
        try {
          const user=await User.findById(arg.request.userId).populate({path:'requests'}) as User
          const images=user.requests.flatMap(request=> request.images)
          request = await Request.create({
            user: arg.request.userId,
            borderColor: arg.request.borderColor,
            borderSize: arg.request.borderSize,
            images: arg.request.images,
            state:'Pending'
          });
          try{
          await processImage(
            arg.request.images,
            arg.request.borderSize,
            arg.request.borderColor,
            arg.request.verticalOrHorizontal
          );
        }catch(err){
         const error=err as Error
         throw new GraphQLError(error.message,{
          extensions:{
            Operational:true
          }
         })
        }
          request=await Request.findByIdAndUpdate(request.id,{state:'Successfull'})
          return request
        } catch (err) {
          await Request.findByIdAndUpdate(request!.id,{state:'failed'})
          const error=err as GraphQLError
          if(error.extensions.Operational){
            throw new GraphQLError(error.message)
          }
          else{
            console.log(err);
            throw new GraphQLError('Unexpected error')
          }
        }
      },
    },
  },
});
const yoga = createYoga({
  schema
}
);

app.all("/graphql", yoga);
app.listen(process.env.PORT);
mongoose.connect(process.env.DB_URL!).then(() => {
  console.log("connected to db");
});
console.log("GraphQL is running at http://localhost:4000/graphql");
