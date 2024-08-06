import { getImage } from "./storage";
import sharp from "sharp";

async function processImage(
  imagesNames: [string],
  borderSize: number,
  borderColor: sharp.Color
) {
    const targetHeight=200
    const images = await Promise.all(
    imagesNames.map((image: any) => {
      return getImage(image);
    })
  );
  const resizedImage=await Promise.all(images.map(async (image)=>{
    const metadata = await sharp(image).metadata();
    return sharp(image).resize({width:Math.round((targetHeight/metadata.height!)*metadata.width!),height:targetHeight}).toBuffer()
  }))
  const imageMetas = await Promise.all(
    resizedImage.map((image, index) => {
      return sharp(resizedImage[index]).metadata();
    })
  );
  let sumWidth = 0;
  imageMetas.map((meta) => {
    sumWidth += meta.width!;
  });
  const collage = await sharp({
    create: {
      width: sumWidth + ((images.length + 1) * borderSize),
      height: imageMetas[0].height! + (borderSize*2),
      channels: 4,
      background: borderColor,
    },
  })
    .composite(
      resizedImage.map((image: any, index) => {
        return {
          input: image,
          top: borderSize,
          left: index * (imageMetas[0].width! + borderSize) + borderSize,
        };
      })
    )
    .jpeg()
    .toFile("./hello.jpeg");
}
export default processImage;
