import { getImage } from "./oStorageConfig";
import sharp from "sharp";
import { upload } from "./oStorageConfig";
import {GraphQLError} from "graphql";
import { error } from "console";
async function processImage(
  imagesNames: [string],
  borderSize: number,
  borderColor: sharp.Color,
  verticalOrHorizontal: string
) {
  try {
    let images:Uint8Array[]=[]
    let sumWidth = 0;
    let sumHeigt = 0;
    let collage: sharp.Sharp;
    const targetHeight = 600;
    const targetWidth = 600;
    let resizedImage: Buffer[] = [];
    images = await Promise.all(
      imagesNames.map((image: any) => {
        return getImage(image);
      })
    );
    if (verticalOrHorizontal == "horizontal") {
      resizedImage = await Promise.all(
        images.map(async (image) => {
          const metadata = await sharp(image).metadata();
          return sharp(image)
            .resize({
              width: Math.round(
                (targetHeight / metadata.height!) * metadata.width!
              ),
              height: targetHeight,
            })
            .toBuffer();
        })
      );
    } else {
      resizedImage = await Promise.all(
        images.map(async (image) => {
          const metadata = await sharp(image).metadata();
          return sharp(image)
            .resize({
              width: targetWidth,
              height: Math.round(
                (targetWidth / metadata.width!) * metadata.height!
              ),
            })
            .toBuffer();
        })
      );
    }
    const imageMetas = await Promise.all(
      resizedImage.map((image, index) => {
        return sharp(resizedImage[index]).metadata();
      })
    );
    imageMetas.map((meta) => {
      sumWidth += meta.width!;
      sumHeigt += meta.height!;
    });
    if (verticalOrHorizontal == "horizontal") {
      collage = sharp({
        create: {
          width: sumWidth + (images.length + 1) * borderSize,
          height: imageMetas[0].height! + borderSize * 2,
          channels: 4,
          background: borderColor,
        },
      });
    } else {
      collage = sharp({
        create: {
          width: imageMetas[0].width! + borderSize * 2,
          height: sumHeigt + (images.length + 1) * borderSize,
          channels: 4,
          background: borderColor,
        },
      });
    }
    if (verticalOrHorizontal == "horizontal") {
      collage.composite(
        resizedImage.map((image: any, index) => {
          return {
            input: image,
            top: borderSize,
            left: index * (imageMetas[0].width! + borderSize) + borderSize,
          };
        })
      );
    } else {
      collage.composite(
        resizedImage.map((image: any, index) => {
          return {
            input: image,
            top: index * (imageMetas[0].height! + borderSize) + borderSize,
            left: borderSize,
            blend: 'dest-in'
          };
        })
      );
    }
    const finalImage=await collage.jpeg().toBuffer();
    upload(finalImage)
  } catch (err) {
    const error = err as Error;
    throw new GraphQLError(error.message,{extensions:{
      Operational:true
    }})
  }
}
export default processImage;
