"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Service = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const s3_1 = require("@neurovault/shared/lib/s3");
const env_1 = require("@neurovault/shared/config/env");
const logger_1 = require("@neurovault/shared/utils/logger");
class S3Service {
    client = (0, s3_1.getS3Client)();
    bucket = env_1.env.S3_BUCKET || "neurovault-documents";
    async uploadFile(file, key, contentType) {
        try {
            logger_1.logger.info(`Uploading file to S3: ${key}`);
            const command = new client_s3_1.PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: file,
                ContentType: contentType,
            });
            await this.client.send(command);
            logger_1.logger.info(`Upload successful: ${key}`);
            return key; // Return the key instead of a public URL
        }
        catch (error) {
            logger_1.logger.error('S3 upload error:', error);
            throw error;
        }
    }
    /**
     * More robust key extraction that handles different S3 URL formats.
     */
    static extractKey(url) {
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
        }
        catch (e) {
            // Fallback if not a URL
            return url;
        }
    }
    async downloadFile(key) {
        try {
            logger_1.logger.info(`[S3Service] Downloading from bucket: "${this.bucket}", key: "${key}"`);
            logger_1.logger.info(`Downloading file from S3: ${key}`);
            const command = new client_s3_1.GetObjectCommand({
                Bucket: this.bucket,
                Key: key,
            });
            const response = await this.client.send(command);
            const byteArray = await response.Body?.transformToByteArray();
            if (!byteArray) {
                throw new Error('Empty S3 response body');
            }
            return Buffer.from(byteArray);
        }
        catch (error) {
            logger_1.logger.error('S3 download error:', error);
            throw error;
        }
    }
    async deleteFile(key) {
        try {
            logger_1.logger.info(`Deleting file from S3: ${key}`);
            const command = new client_s3_1.DeleteObjectCommand({
                Bucket: this.bucket,
                Key: key,
            });
            await this.client.send(command);
            logger_1.logger.info(`Deletion successful: ${key}`);
        }
        catch (error) {
            logger_1.logger.error('S3 delete error:', error);
            throw error;
        }
    }
    async getSignedUrl(key, expiresIn = 3600) {
        try {
            const command = new client_s3_1.GetObjectCommand({
                Bucket: this.bucket,
                Key: key,
            });
            return await (0, s3_request_presigner_1.getSignedUrl)(this.client, command, { expiresIn });
        }
        catch (error) {
            logger_1.logger.error('S3 signed URL error:', error);
            throw error;
        }
    }
}
exports.S3Service = S3Service;
