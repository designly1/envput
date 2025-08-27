import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { S3Config } from "./types";

/**
 * Creates and configures an S3 client
 */
function createS3Client(
  region: string,
  accessKeyId?: string,
  secretAccessKey?: string
): S3Client {
  const clientConfig: any = { region };

  if (accessKeyId && secretAccessKey) {
    clientConfig.credentials = {
      accessKeyId,
      secretAccessKey,
    };
  }
  // Otherwise, AWS SDK will automatically use credentials from:
  // - Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
  // - AWS credentials file
  // - IAM roles (if running on EC2)
  // - AWS SSO

  return new S3Client(clientConfig);
}

/**
 * Uploads data to S3
 */
export async function uploadToS3(
  data: Buffer,
  config: S3Config,
  accessKeyId?: string,
  secretAccessKey?: string
): Promise<void> {
  const s3Client = createS3Client(config.region, accessKeyId, secretAccessKey);

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: config.key,
    Body: data,
    ContentType: "application/octet-stream",
    ServerSideEncryption: "AES256", // Additional server-side encryption
    Metadata: {
      "envput-version": "1.0.0",
      "content-type": "encrypted-env-file",
    },
  });

  try {
    await s3Client.send(command);
    console.log(
      `✅ Successfully uploaded to s3://${config.bucket}/${config.key}`
    );
  } catch (error) {
    throw new Error(
      `Failed to upload to S3: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Downloads data from S3
 */
export async function downloadFromS3(
  config: S3Config,
  accessKeyId?: string,
  secretAccessKey?: string
): Promise<Buffer> {
  const s3Client = createS3Client(config.region, accessKeyId, secretAccessKey);

  // First check if the object exists
  try {
    const headCommand = new HeadObjectCommand({
      Bucket: config.bucket,
      Key: config.key,
    });
    await s3Client.send(headCommand);
  } catch (error) {
    throw new Error(`File not found: s3://${config.bucket}/${config.key}`);
  }

  // Download the object
  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: config.key,
  });

  try {
    const response = await s3Client.send(command);

    if (!response.Body) {
      throw new Error("Empty response body from S3");
    }

    // Convert the response body to Buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }

    const data = Buffer.concat(chunks);
    console.log(
      `✅ Successfully downloaded from s3://${config.bucket}/${config.key}`
    );

    return data;
  } catch (error) {
    throw new Error(
      `Failed to download from S3: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

/**
 * Checks if an object exists in S3
 */
export async function objectExists(
  config: S3Config,
  accessKeyId?: string,
  secretAccessKey?: string
): Promise<boolean> {
  const s3Client = createS3Client(config.region, accessKeyId, secretAccessKey);

  try {
    const command = new HeadObjectCommand({
      Bucket: config.bucket,
      Key: config.key,
    });
    await s3Client.send(command);
    return true;
  } catch {
    return false;
  }
}
