import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "../config/env";

const configuredEndpoint = config.r2.endpoint.replace(new RegExp(`/${config.r2.bucket}$`), "");

const r2Client = new S3Client({
  region: "auto",
  endpoint: configuredEndpoint || `https://${config.r2.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: config.r2.accessKeyId,
    secretAccessKey: config.r2.secretAccessKey,
  },
});

export const uploadPrivateFile = async (file: Express.Multer.File, key: string): Promise<void> => {
  await r2Client.send(new PutObjectCommand({
    Bucket: config.r2.bucket,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
    ContentLength: file.size,
  }));
};

export const getPrivateFileUrl = async (key: string): Promise<string> => {
  return getSignedUrl(r2Client, new GetObjectCommand({ Bucket: config.r2.bucket, Key: key }), { expiresIn: 900 });
};

export const deletePrivateFile = async (key: string): Promise<void> => {
  await r2Client.send(new DeleteObjectCommand({ Bucket: config.r2.bucket, Key: key }));
};