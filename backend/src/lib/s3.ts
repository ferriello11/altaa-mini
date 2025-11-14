import {
  S3Client,
  PutObjectCommand
} from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
});

export async function uploadToS3(file: Express.Multer.File): Promise<string> {
  const fileKey = `company-logos/${Date.now()}-${file.originalname}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: fileKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  return `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${fileKey}`;
}
