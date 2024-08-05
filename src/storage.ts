import AWS from 'aws-sdk';
import dotenv from "dotenv"
dotenv.config()
const s3 = new AWS.S3({
    endpoint: process.env.S3ENDPOINT,
    accessKeyId: process.env.ACCESSKEY,
    secretAccessKey:process.env.SECRETKEY
});
async function generateUploadURL() {
    const params = {
        Bucket: 'canny',
        Key: 'yourfile',
        Expires: 600,
        ContentType: 'image/jpeg'
    };
    return s3.getSignedUrlPromise('putObject', params);
}
export default generateUploadURL
