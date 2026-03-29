import { S3Client } from '@aws-sdk/client-s3';
import { env } from '@/config/env';

let s3Client: S3Client | null = null;

/**
 * Returns a singleton AWS S3 client instance.
 * Used for document file storage operations.
 */
export function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region: env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID || 'missing_key',
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY || 'missing_secret',
      },
    });
  }

  return s3Client;
}
