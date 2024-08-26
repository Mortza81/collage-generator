import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  ListObjectsCommand,
  _Object,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
import { GraphQLError } from "graphql";
dotenv.config();
const client = new S3Client({
  region: "default",
  endpoint: process.env.S3ENDPOINT,
  credentials: {
    accessKeyId: process.env.ACCESSKEY!,
    secretAccessKey: process.env.SECRETKEY!,
  },
});
export async function generatePresignedURL(purpose: string, fileName: string) {
  try {
    let command;
    if (purpose == "Download") {
      command = new GetObjectCommand({
        Bucket: process.env.BUCKET,
        Key: `collage/results/${fileName}.jpeg`,
        ResponseContentType: "image/jpeg",
      });
    } else {
      command = new PutObjectCommand({
        Bucket: process.env.BUCKET,
        Key: `collage/${fileName}`
      });
    }
    const preSignedUrl = await getSignedUrl(client, command, {
      expiresIn: 3600,
    });
    return preSignedUrl;
  } catch (err) {
    const error = err as Error;
    throw new GraphQLError(error.message);
  }
}
export async function getImage(fileName: string) {
  const params = {
    Bucket: process.env.BUCKET,
    Key: `collage/${fileName}`,
  };
  try {
    const data = await client.send(new GetObjectCommand(params));
    return await data.Body!.transformToByteArray();
  } catch (err) {
    const error = err as GraphQLError;
    throw new GraphQLError("File does not exists", {
      extensions: {
        Operational: true,
      },
    });
  }
}
export async function upload(file: Buffer, name: string) {
  const params = {
    Body: file,
    Bucket: process.env.BUCKET,
    Key: `collage/results/${name}.jpeg`,
  };
  try {
    await client.send(new PutObjectCommand(params));
  } catch (err) {
    const error = err as Error;
    console.log(error.message);
    throw new GraphQLError(error.message, {
      extensions: {
        Operational: true,
      },
    });
  }
}
export async function deleteOldImages() {
  const limit = 7 * 24 * 60 * 60 * 1000;
  const now = new Date().getTime();
  const objToDel: {Key: string}[] = [];
  const params = {
    Bucket: process.env.BUCKET,
    Prefix: "collage/",
  };
  try {
    const command = new ListObjectsCommand(params);
    const res = await client.send(command);
    res.Contents?.forEach((file) => {
      if (file.Key !== "collage/" && file.Key !== "collage/results/") {
        const fileLastModified = new Date(file.LastModified!).getTime();
        if (fileLastModified < now - limit) {
          objToDel.push({ Key: file.Key! });
        }
      }
    });
    if (objToDel.length == 0) {
      console.log("No old file to delete");
      return;
    }
    const delParams = {
      Bucket: process.env.BUCKET,
      Delete: {
        Objects: objToDel,
      },
    };
    const delCommand = new DeleteObjectsCommand(delParams);
    await client.send(delCommand);
    console.log("Old images deleted successfully");
  } catch (err) {
    console.log(err);
  }
}
