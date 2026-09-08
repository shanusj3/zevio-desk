export interface PresignedUploadResult {
  url: string;
  fields: Record<string, string>;
  expiresAt: Date;
}

export interface ObjectHeadResult {
  sizeBytes: number;
  mimeType?: string;
  eTag?: string;
  versionId?: string;
}

export interface StorageProvider {
  createUploadUrl(
    key: string,
    contentType: string,
    maxSizeBytes: number,
    expiresInSeconds?: number
  ): Promise<PresignedUploadResult>;

  headObject(key: string): Promise<ObjectHeadResult | null>;

  copyObject(sourceKey: string, destKey: string): Promise<string | undefined>;

  deleteObject(key: string): Promise<void>;

  createDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;

  objectExists(key: string): Promise<boolean>;
}
