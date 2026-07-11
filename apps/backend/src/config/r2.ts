import { S3Client } from "@aws-sdk/client-s3";
import { env } from "./env";

/**
 * Cloudflare R2 kompatibel dengan S3 API, jadi cukup pakai @aws-sdk/client-s3
 * dengan endpoint custom, tanpa perlu SDK khusus Cloudflare.
 */
export const r2Client = new S3Client({
  region: "auto",
  endpoint: env.R2_ENDPOINT,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
});

export const R2_BUCKET = env.R2_BUCKET_NAME;
export const R2_PUBLIC_BASE_URL = env.R2_PUBLIC_BASE_URL;
