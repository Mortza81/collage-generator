import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
dotenv.config();
const client = new S3Client({
  region: "default",
  endpoint: process.env.S3ENDPOINT,
  credentials: {
    accessKeyId: process.env.ACCESSKEY!,
    secretAccessKey: process.env.SECRETKEY!,
  },
});
export async function generateUploadURL() {
  const command = new PutObjectCommand({
    Bucket: process.env.BUCKET,
    Key: "collage/yourfile",
  });

  const preSignedUrl = await getSignedUrl(client, command, {
    expiresIn: 3600,
  });
  return preSignedUrl;
}
export async function getImage(fileName: string) {
  const params = {
    Bucket: process.env.BUCKET,
    Key: `collage/${fileName}`,
  };
  try {
    const data = await client.send(new GetObjectCommand(params));
    if (!data.Body) {
      throw new Error("there is no file with this name");
    }
    return data.Body.transformToByteArray();
  } catch (error) {
    console.log(error);
  }
}
