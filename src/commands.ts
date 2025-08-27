import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import inquirer from "inquirer";
import {
  encrypt,
  decrypt,
  packEncryptedData,
  unpackEncryptedData,
} from "./crypto";
import { uploadToS3, downloadFromS3, objectExists } from "./s3";
import { CliOptions } from "./types";
import {
  readConfig,
  configExists,
  createConfig,
  listEnvironments,
  getEnvironment,
  selectEnvironment,
  generateS3Key,
} from "./config";

/**
 * Initialize command - creates a new .envputrc configuration file
 */
export async function initConfig(): Promise<void> {
  try {
    if (configExists()) {
      const { overwrite } = await inquirer.prompt([
        {
          type: "confirm",
          name: "overwrite",
          message: "Configuration file already exists. Overwrite?",
          default: false,
        },
      ]);

      if (!overwrite) {
        console.log("❌ Initialization cancelled");
        return;
      }
    }

    await createConfig();
  } catch (error) {
    console.error(
      `❌ Initialization failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    process.exit(1);
  }
}

/**
 * List command - shows all configured environments
 */
export async function listCommand(): Promise<void> {
  try {
    const config = readConfig();
    listEnvironments(config);
  } catch (error) {
    console.error(
      `❌ Failed to list environments: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    process.exit(1);
  }
}

/**
 * Upload command - uploads an environment file to S3
 */
export async function uploadCommand(
  environmentArg: string | undefined,
  options: CliOptions
): Promise<void> {
  try {
    const config = readConfig();

    // Get the environment to upload (positional arg takes precedence over option)
    const environmentName = environmentArg || options.environment;
    const env = environmentName
      ? getEnvironment(config, environmentName)
      : await selectEnvironment(config);

    const filePath = resolve(env.file);

    // Check if file exists
    if (!existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      process.exit(1);
    }

    console.log(`📁 Reading file: ${filePath}`);
    const fileContent = readFileSync(filePath, "utf8");

    // Generate S3 key for this environment
    const s3Key = generateS3Key(config, env.name);
    const s3Config = {
      bucket: config.aws.bucket,
      key: s3Key,
      region: config.aws.region,
    };

    const exists = await objectExists(
      s3Config,
      config.aws.accessKeyId,
      config.aws.secretAccessKey
    );

    if (exists) {
      const { overwrite } = await inquirer.prompt([
        {
          type: "confirm",
          name: "overwrite",
          message: `Environment '${env.name}' already exists in S3. Overwrite?`,
          default: false,
        },
      ]);

      if (!overwrite) {
        console.log("❌ Upload cancelled");
        return;
      }
    }

    console.log(`🔐 Encrypting ${env.name} environment...`);
    const encrypted = encrypt(fileContent, config.encryptionKey);
    const packedData = packEncryptedData(encrypted);

    console.log("☁️  Uploading to S3...");
    await uploadToS3(
      packedData,
      s3Config,
      config.aws.accessKeyId,
      config.aws.secretAccessKey
    );

    console.log(`🎉 Environment '${env.name}' uploaded successfully!`);
  } catch (error) {
    console.error(
      `❌ Upload failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    process.exit(1);
  }
}

/**
 * Download command - downloads an environment file from S3
 */
export async function downloadCommand(
  environmentArg: string | undefined,
  options: CliOptions
): Promise<void> {
  try {
    const config = readConfig();

    // Get the environment to download (positional arg takes precedence over option)
    const environmentName = environmentArg || options.environment;
    const env = environmentName
      ? getEnvironment(config, environmentName)
      : await selectEnvironment(config);

    const filePath = resolve(env.file);

    // Check if local file exists and ask for confirmation
    if (existsSync(filePath)) {
      const { overwrite } = await inquirer.prompt([
        {
          type: "confirm",
          name: "overwrite",
          message: `Local file already exists: ${filePath}. Overwrite?`,
          default: false,
        },
      ]);

      if (!overwrite) {
        console.log("❌ Download cancelled");
        return;
      }
    }

    console.log(`☁️  Downloading ${env.name} environment from S3...`);
    const s3Key = generateS3Key(config, env.name);
    const s3Config = {
      bucket: config.aws.bucket,
      key: s3Key,
      region: config.aws.region,
    };

    const packedData = await downloadFromS3(
      s3Config,
      config.aws.accessKeyId,
      config.aws.secretAccessKey
    );

    console.log("🔓 Decrypting file...");
    try {
      const { data, iv, salt } = unpackEncryptedData(packedData);
      const decrypted = decrypt(data, iv, salt, config.encryptionKey);

      console.log(`📁 Writing to file: ${filePath}`);
      writeFileSync(filePath, decrypted.data);

      console.log(`🎉 Environment '${env.name}' downloaded successfully!`);
    } catch (decryptError) {
      throw new Error(
        "Failed to decrypt file. The encryption key may be invalid or the file may be corrupted."
      );
    }
  } catch (error) {
    console.error(
      `❌ Download failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    process.exit(1);
  }
}
