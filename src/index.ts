import express from "express";
import { createSchema, createYoga } from "graphql-yoga";
import { Query } from "mongoose";
import presigner from "./storage"
import dotenv from "dotenv"
dotenv.config()
const app = express();

const schema=createSchema({
    typeDefs:/* GraphQL */`
    type Query{
        uploadRequest:String
    }
    `,
    resolvers:{
        Query:{
            uploadRequest:async ()=>{
                let presign
                try{
                presign=await presigner()
                }
                catch(err){
                    console.log(err);
                    return 'There was somthing wrong while generating presign url'
                }
                return `You can upload your via:${presign}`
            }
        }
    }

})
const yoga = createYoga({
    schema 
})

app.all(
  "/graphql",yoga
);
app.listen(process.env.PORT);
console.log("Running a GraphQL API server at http://localhost:4000/graphql");
