import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve } from "path";
import { randomBytes } from "crypto";
import inquirer from "inquirer";
import { EnvputConfig, EnvFileConfig } from "./types";

const CONFIG_FILE = ".envputrc";

/**
 * Generates a secure encryption key
 */
function generateEncryptionKey(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Generates S3 key path for an environment
 */
export function generateS3Key(
  config: EnvputConfig,
  environmentName: string
): string {
  // Normalize bucketPath - remove leading/trailing slashes and handle root case
  let bucketPath = config.aws.bucketPath.trim();

  // Remove leading slash
  if (bucketPath.startsWith("/")) {
    bucketPath = bucketPath.substring(1);
  }

  // Remove trailing slash
  if (bucketPath.endsWith("/")) {
    bucketPath = bucketPath.substring(0, bucketPath.length - 1);
  }

  // Build the path - only add prefix if bucketPath is not empty
  if (bucketPath === "") {
    return `${config.projectName}/${environmentName}`;
  } else {
    return `${bucketPath}/${config.projectName}/${environmentName}`;
  }
}

/**
 * Gets the path to the config file in the current working directory
 */
function getConfigPath(): string {
  return resolve(process.cwd(), CONFIG_FILE);
}

/**
 * Checks if the config file exists
 */
export function configExists(): boolean {
  return existsSync(getConfigPath());
}

/**
 * Reads and parses the config file
 */
export function readConfig(): EnvputConfig {
  const configPath = getConfigPath();

  if (!existsSync(configPath)) {
    throw new Error(
      `Configuration file not found: ${CONFIG_FILE}. Run 'npx envput init' to create one.`
    );
  }

  try {
    const configContent = readFileSync(configPath, "utf8");
    const config = JSON.parse(configContent) as EnvputConfig;

    // Validate config structure
    validateConfig(config);

    return config;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in ${CONFIG_FILE}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Writes the config to file
 */
export function writeConfig(config: EnvputConfig): void {
  const configPath = getConfigPath();
  const configContent = JSON.stringify(config, null, 2);

  writeFileSync(configPath, configContent, "utf8");
  console.log(`✅ Configuration saved to ${CONFIG_FILE}`);
}

/**
 * Validates the config structure
 */
function validateConfig(config: any): asserts config is EnvputConfig {
  if (!config || typeof config !== "object") {
    throw new Error("Configuration must be a JSON object");
  }

  // Validate top-level fields
  if (!config.projectName || typeof config.projectName !== "string") {
    throw new Error("Configuration must have a 'projectName' field");
  }

  if (!config.encryptionKey || typeof config.encryptionKey !== "string") {
    throw new Error("Configuration must have an 'encryptionKey' field");
  }

  if (!config.aws || typeof config.aws !== "object") {
    throw new Error("Configuration must have an 'aws' section");
  }

  const requiredAwsFields = [
    "accessKeyId",
    "secretAccessKey",
    "region",
    "bucket",
    "bucketPath",
  ];
  for (const field of requiredAwsFields) {
    if (!config.aws[field] || typeof config.aws[field] !== "string") {
      throw new Error(`AWS configuration missing required field: ${field}`);
    }
  }

  if (!Array.isArray(config.environments)) {
    throw new Error("Configuration must have an 'environments' array");
  }

  for (let i = 0; i < config.environments.length; i++) {
    const env = config.environments[i];
    if (!env || typeof env !== "object") {
      throw new Error(`Environment ${i} must be an object`);
    }

    const requiredEnvFields = ["name", "file"];
    for (const field of requiredEnvFields) {
      if (!env[field] || typeof env[field] !== "string") {
        throw new Error(`Environment ${i} missing required field: ${field}`);
      }
    }
  }
}

/**
 * Creates a new config file interactively
 */
export async function createConfig(): Promise<EnvputConfig> {
  console.log("🚀 Creating new envput configuration...\n");

  // Project Configuration
  console.log("📋 Project Configuration:");
  const projectConfig = await inquirer.prompt([
    {
      type: "input",
      name: "projectName",
      message: "Project name (used in S3 paths):",
      validate: (input: string) => {
        const trimmed = input.trim();
        if (trimmed.length === 0) return "Project name is required";
        if (!/^[a-zA-Z0-9-_]+$/.test(trimmed)) {
          return "Project name can only contain letters, numbers, hyphens, and underscores";
        }
        return true;
      },
    },
  ]);

  // Generate encryption key
  const encryptionKey = generateEncryptionKey();
  console.log("🔑 Generated secure encryption key");

  // AWS Configuration
  console.log("\n📋 AWS Configuration:");
  const awsConfig = await inquirer.prompt([
    {
      type: "input",
      name: "accessKeyId",
      message: "AWS Access Key ID:",
      validate: (input: string) =>
        input.trim().length > 0 || "Access Key ID is required",
    },
    {
      type: "password",
      name: "secretAccessKey",
      message: "AWS Secret Access Key:",
      validate: (input: string) =>
        input.trim().length > 0 || "Secret Access Key is required",
    },
    {
      type: "input",
      name: "region",
      message: "AWS Region:",
      default: "us-east-1",
      validate: (input: string) =>
        input.trim().length > 0 || "Region is required",
    },
    {
      type: "input",
      name: "bucket",
      message: "S3 Bucket name:",
      validate: (input: string) =>
        input.trim().length > 0 || "Bucket name is required",
    },
    {
      type: "input",
      name: "bucketPath",
      message: "S3 Bucket path (directory within bucket):",
      default: "/",
      validate: (input: string) => {
        const trimmed = input.trim();
        if (trimmed.length === 0) return "Bucket path is required";
        if (!trimmed.startsWith("/")) return "Bucket path must start with '/'";
        return true;
      },
    },
  ]);

  // Environment Configuration
  console.log("\n📁 Environment Files:");
  const environments: EnvFileConfig[] = [];

  let addMore = true;
  while (addMore) {
    const envConfig = await inquirer.prompt([
      {
        type: "input",
        name: "name",
        message: `Environment name (e.g., 'development', 'production'):`,
        validate: (input: string) => {
          const trimmed = input.trim();
          if (trimmed.length === 0) return "Environment name is required";
          if (!/^[a-zA-Z0-9-_]+$/.test(trimmed)) {
            return "Environment name can only contain letters, numbers, hyphens, and underscores";
          }
          if (environments.some((env) => env.name === trimmed)) {
            return "Environment name must be unique";
          }
          return true;
        },
      },
      {
        type: "input",
        name: "file",
        message: "Local file path:",
        default: (answers: any) => `.env.${answers.name || "local"}`,
        validate: (input: string) =>
          input.trim().length > 0 || "File path is required",
      },
    ]);

    environments.push(envConfig);

    const { continueAdding } = await inquirer.prompt([
      {
        type: "confirm",
        name: "continueAdding",
        message: "Add another environment?",
        default: false,
      },
    ]);

    addMore = continueAdding;
  }

  const config: EnvputConfig = {
    projectName: projectConfig.projectName,
    encryptionKey,
    aws: awsConfig,
    environments,
  };

  writeConfig(config);

  console.log(
    `\n🎉 Configuration created with ${environments.length} environment(s)!`
  );
  console.log(`💡 Don't forget to add ${CONFIG_FILE} to your .gitignore file.`);

  console.log(`\n⚠️  CRITICAL WARNING: BACKUP YOUR ENCRYPTION KEY!`);
  console.log(
    `   If you lose your ${CONFIG_FILE} file, you will PERMANENTLY lose`
  );
  console.log(`   access to ALL your encrypted environment files in S3.`);
  console.log(`   Store this file securely in multiple locations!`);

  return config;
}

/**
 * Lists all configured environments
 */
export function listEnvironments(config: EnvputConfig): void {
  console.log("📋 Configured environments:\n");

  if (config.environments.length === 0) {
    console.log("No environments configured.");
    return;
  }

  config.environments.forEach((env, index) => {
    const s3Key = generateS3Key(config, env.name);
    console.log(`${index + 1}. ${env.name}`);
    console.log(`   File: ${env.file}`);
    console.log(`   S3 Path: s3://${config.aws.bucket}/${s3Key}`);
    console.log("");
  });
}

/**
 * Gets a specific environment by name
 */
export function getEnvironment(
  config: EnvputConfig,
  name: string
): EnvFileConfig {
  const env = config.environments.find((e) => e.name === name);

  if (!env) {
    const available = config.environments.map((e) => e.name).join(", ");
    throw new Error(`Environment '${name}' not found. Available: ${available}`);
  }

  return env;
}

/**
 * Prompts user to select an environment if none specified
 */
export async function selectEnvironment(
  config: EnvputConfig
): Promise<EnvFileConfig> {
  if (config.environments.length === 0) {
    throw new Error(
      "No environments configured. Run 'npx envput init' to add some."
    );
  }

  if (config.environments.length === 1) {
    return config.environments[0];
  }

  const { selectedEnv } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedEnv",
      message: "Select environment:",
      choices: config.environments.map((env) => ({
        name: `${env.name} (${env.file})`,
        value: env.name,
      })),
    },
  ]);

  return getEnvironment(config, selectedEnv);
}
