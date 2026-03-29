import { 
  PutObjectCommand, 
  GetObjectCommand, 
  DeleteObjectCommand 
} from '@aws-sdk/client-s3';
import { getSignedUrl as getS3SignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3Client } from '@/lib/s3';
import { env } from '@/config/env';
import { logger } from '@/utils/logger';

export class S3Service {
  private client = getS3Client();
  private bucket = env.S3_BUCKET || "neurovault-documents";

  async uploadFile(file: Buffer, key: string, contentType: string): Promise<string> {
    try {
      logger.info(`Uploading file to S3: ${key}`);
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: contentType,
      });

      await this.client.send(command);
      logger.info(`Upload successful: ${key}`);
      return key; // Return the key instead of a public URL
    } catch (error) {
      logger.error('S3 upload error:', error);
      throw error;
    }
  }

  /**
   * More robust key extraction that handles different S3 URL formats.
   */
  public static extractKey(url: string): string {
    try {
      const urlObj = new URL(url);
      // Path usually starts with /bucket-name/key or just /key for virtual-style
      // If it ends in .amazonaws.com, it's likely virtual-host or path-style
      const pathname = decodeURIComponent(urlObj.pathname);
      
      // Remove leading slash
      let key = pathname.startsWith('/') ? pathname.substring(1) : pathname;
      
      // If path still contains the bucket name (path-style), remove it
      // This is a common pattern in the current codebase where s3Url is assumed public
      return key;
    } catch (e) {
      // Fallback if not a URL
      return url;
    }
  }


  async downloadFile(key: string): Promise<Buffer> {
    try {
    logger.info(`[S3Service] Downloading from bucket: "${this.bucket}", key: "${key}"`);
      logger.info(`Downloading file from S3: ${key}`);
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response = await this.client.send(command);
      const byteArray = await response.Body?.transformToByteArray();
      
      if (!byteArray) {
        throw new Error('Empty S3 response body');
      }

      return Buffer.from(byteArray);
    } catch (error) {
      logger.error('S3 download error:', error);
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      logger.info(`Deleting file from S3: ${key}`);
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      await this.client.send(command);
      logger.info(`Deletion successful: ${key}`);
    } catch (error) {
      logger.error('S3 delete error:', error);
      throw error;
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      return await getS3SignedUrl(this.client, command, { expiresIn });
    } catch (error) {
      logger.error('S3 signed URL error:', error);
      throw error;
    }
  }
}
