import express from "express";
import { createSchema, createYoga } from "graphql-yoga";
import mongoose from "mongoose";
import dotenv from "dotenv";
import resolvers from './graphql/resolvers'
import mySchema from "./graphql/schema";
import {deleteOldImages} from "./oStorageConfig"

dotenv.config();
const app = express();

const schema = createSchema({
  typeDefs: mySchema,
  resolvers: resolvers
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
import cron from "node-cron"
cron.schedule("0 3 * * 0",()=>{
    deleteOldImages()
})
