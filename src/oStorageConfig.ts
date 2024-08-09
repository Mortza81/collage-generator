import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
import { GraphQLError } from "graphql";
dotenv.config();
const client = new S3Client({
  region: "us-east-1",
  endpoint: process.env.S3ENDPOINT,
  credentials: {
    accessKeyId: process.env.ACCESSKEY!,
    secretAccessKey: process.env.SECRETKEY!,
  },
});
export async function generateUploadURL() {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET,
      Key: "collage/yourfile",
    });

    const preSignedUrl = await getSignedUrl(client, command, {
      expiresIn: 3600,
    });
    return preSignedUrl;
  } catch (err) {
    const error=err as Error
    throw new GraphQLError(error.message)
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
export async function upload(file: Buffer,name:string) {
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