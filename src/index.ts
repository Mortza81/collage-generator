import express from "express";
import processImage from "./processImage";
import { createSchema, createYoga } from "graphql-yoga";
import mongoose, { mongo, Query } from "mongoose";
import User from "./db/userModel";
import Request from "./db/requestModel";
import { generateUploadURL, getImage } from "./storage";
import dotenv from "dotenv";
import sharp from "sharp";
dotenv.config();
const app = express();

const schema = createSchema({
  typeDefs: /* GraphQL */ `
    type Query {
      uploadRequest: String
    }
    type Mutation {
      collageRequest(request: createRequestInput!): Request
      uploadRequest(info: uploadRequestInput!): String
    }
    input uploadRequestInput {
      name: String
      email: String
    }
    input createRequestInput {
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
          user = await User.find({ email: arg.info.email });
          if (user.length == 0) {
            user = await User.create({
              name: arg.info.name,
              email: arg.info.email,
            });
          }
        } catch (err) {
          console.log(err);
          return "There was somthing wrong while generating presign url";
        }
        return `You can upload your images via:${presign} (valid for 10 minutes)`;
      },
      collageRequest: async (_, arg) => {
        await processImage(
          arg.request.images,
          arg.request.borderSize,
          arg.request.borderColor
        );
      },
    },
  },
});
const yoga = createYoga({
  schema,
});

app.all("/graphql", yoga);
app.listen(process.env.PORT);
mongoose.connect(process.env.DB_URL!).then(() => {
  console.log("connected to db");
});
console.log("Running a GraphQL API server at http://localhost:4000/graphql");
