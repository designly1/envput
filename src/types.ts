export interface EnvputOptions {
  file: string;
  bucket: string;
  key: string;
  password: string;
  region: string;
}

export interface S3Config {
  bucket: string;
  key: string;
  region: string;
}

export interface CryptoResult {
  data: Buffer;
  iv: Buffer;
  salt: Buffer;
}

export interface DecryptedResult {
  data: string;
}

export interface EnvFileConfig {
  name: string;
  file: string;
}

export interface EnvputConfig {
  projectName: string;
  encryptionKey: string;
  aws: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucket: string;
    bucketPath: string;
  };
  environments: EnvFileConfig[];
}

export interface CliOptions {
  environment?: string;
  list?: boolean;
  init?: boolean;
}
