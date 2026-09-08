import {
  S3Client,
  HeadObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  StorageProvider,
  PresignedUploadResult,
  ObjectHeadResult,
} from "./storage.provider";

export class S3StorageProvider implements StorageProvider {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.client = new S3Client({
      region: process.env.AWS_REGION || "us-east-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
    this.bucket = process.env.AWS_S3_BUCKET || "zevio-desk-uploads";
  }

  getBucketName(): string {
    return this.bucket;
  }

  async createUploadUrl(
    key: string,
    contentType: string,
    maxSizeBytes: number,
    expiresInSeconds = 1800 // 30 mins
  ): Promise<PresignedUploadResult> {
    const { url, fields } = await createPresignedPost(this.client, {
      Bucket: this.bucket,
      Key: key,
      Conditions: [
        ["content-length-range", 0, maxSizeBytes],
        ["eq", "$Content-Type", contentType],
      ],
      Fields: { "Content-Type": contentType },
      Expires: expiresInSeconds,
    });

    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    return { url, fields, expiresAt };
  }

  /**
   * Generates a direct HTTP PUT presigned URL targeting the object key
   */
  async createPutUploadUrl(
    key: string,
    contentType: string,
    expiresInSeconds = 300 // 5 mins
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  /**
   * Directly uploads buffer binary to S3
   */
  async putObject(key: string, buffer: Buffer, contentType: string): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });
    await this.client.send(command);
  }

  async headObject(key: string): Promise<ObjectHeadResult | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      const response = await this.client.send(command);
      return {
        sizeBytes: response.ContentLength || 0,
        mimeType: response.ContentType,
        eTag: response.ETag,
        versionId: response.VersionId,
      };
    } catch (err: any) {
      if (err.name === "NotFound" || err.$metadata?.httpStatusCode === 404) {
        return null;
      }
      throw err;
    }
  }

  async objectExists(key: string): Promise<boolean> {
    const head = await this.headObject(key);
    return head !== null;
  }

  async copyObject(sourceKey: string, destKey: string): Promise<string | undefined> {
    const command = new CopyObjectCommand({
      Bucket: this.bucket,
      CopySource: `${this.bucket}/${encodeURIComponent(sourceKey)}`,
      Key: destKey,
    });
    const response = await this.client.send(command);
    return response.VersionId;
  }

  async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    await this.client.send(command);
  }

  async createDownloadUrl(key: string, expiresInSeconds = 900): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }
}

export const s3StorageProvider = new S3StorageProvider();
