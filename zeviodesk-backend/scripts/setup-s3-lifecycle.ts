import { S3Client, PutBucketLifecycleConfigurationCommand } from "@aws-sdk/client-s3";
import dotenv from "dotenv";
dotenv.config();

async function configureS3Lifecycle() {
  const bucketName = process.env.AWS_S3_BUCKET || "zevio-desk-uploads";
  const client = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    },
  });

  console.log(`[AWS S3 Setup] Configuring lifecycle rules for bucket: ${bucketName}...`);

  const command = new PutBucketLifecycleConfigurationCommand({
    Bucket: bucketName,
    LifecycleConfiguration: {
      Rules: [
        {
          ID: "QuarantineTemporaryObjectAutoExpiration",
          Filter: { Prefix: "quarantine/" },
          Status: "Enabled",
          Expiration: { Days: 2 },
        },
        {
          ID: "AbortIncompleteMultipartUploadsSafetyNet",
          Filter: { Prefix: "" },
          Status: "Enabled",
          AbortIncompleteMultipartUpload: { DaysAfterInitiation: 2 },
        },
      ],
    },
  });

  try {
    await client.send(command);
    console.log(`✅ [AWS S3 Setup] Successfully applied lifecycle configuration to bucket '${bucketName}'!`);
    console.log("   - Prefix 'quarantine/': Expire objects after 48 hours (2 days)");
    console.log("   - Multipart Uploads: Abort incomplete uploads after 48 hours (2 days)");
  } catch (err: any) {
    console.error(`❌ [AWS S3 Setup] Failed to configure lifecycle rules:`, err.message);
  }
}

configureS3Lifecycle();
