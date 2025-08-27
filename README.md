# envput

![NPM Version](https://img.shields.io/npm/v/envput)
![Static Badge](https://img.shields.io/badge/build-passing-brightgreen)
![NPM License](https://img.shields.io/npm/l/envput)

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-FF9900?logo=amazonaws&logoColor=white)


A secure CLI tool to encrypt and upload/download environment files to/from AWS S3 using a simple configuration file.

## Author

Jay Simons - https://yaa.bz

## Official Website

https://yaa.bz/projects/envput

## Features

- 🔐 **Secure Encryption**: Uses AES-256-CBC encryption with PBKDF2 key derivation
- ☁️ **S3 Storage**: Upload and download encrypted env files to/from AWS S3
- 🛡️ **Auto-Generated Encryption**: Single encryption key generated during initialization
- 📋 **Configuration File**: Simple `.envputrc` file manages AWS credentials and environments
- 🚀 **NPX Ready**: Use without installation via `npx envput`
- 🔄 **Multi-Environment**: Manage multiple environment files (dev, staging, prod)

## Quick Start

> **🚨 IMPORTANT:** After running `envput init`, immediately backup your `.envputrc` file! If you lose it, you'll lose access to all your encrypted environment files permanently.

### 1. Initialize Configuration

```bash
npx envput init
```

This creates a `.envputrc` file with your AWS credentials and environment configurations.

### 2. Add to .gitignore

```bash
echo ".envputrc" >> .gitignore
```

### 3. **BACKUP YOUR CONFIG FILE!**

```bash
# Example: Copy to secure backup location
cp .envputrc ~/secure-backups/myproject-envputrc.backup
# Store in password manager, encrypted cloud storage, etc.
```

### 4. Upload/Download Environments

```bash
# Upload an environment
npx envput upload

# Download an environment  
npx envput download

# List configured environments
npx envput list
```

## Installation

### Use without Installation (Recommended)
```bash
npx envput init
npx envput upload
npx envput download
```

### Global Installation
```bash
npm install -g envput
envput init
envput upload
```

## Configuration File (.envputrc)

The `.envputrc` file contains your AWS credentials and environment definitions:

```json
{
  "projectName": "myapp",
  "encryptionKey": "generated-encryption-key-here",
  "aws": {
    "accessKeyId": "your-access-key-id",
    "secretAccessKey": "your-secret-access-key", 
    "region": "us-east-1",
    "bucket": "your-s3-bucket",
    "bucketPath": "/"
  },
  "environments": [
    {
      "name": "development",
      "file": ".env.development"
    },
    {
      "name": "production", 
      "file": ".env.production"
    }
  ]
}
```

### Configuration Fields

**AWS Section:**
- `accessKeyId`: Your AWS access key ID
- `secretAccessKey`: Your AWS secret access key
- `region`: AWS region for S3 bucket
- `bucket`: S3 bucket name for storing encrypted files

**Environment Section:**
- `name`: Friendly name for the environment
- `file`: Local file path to environment file

**S3 Path Generation:**
Files are stored at: `{bucketPath}/{projectName}/{environmentName}`

## Commands

### `envput init`
Creates a new `.envputrc` configuration file interactively.

```bash
npx envput init
```

### `envput list`
Lists all configured environments.

```bash
npx envput list
# or
npx envput ls
```

### `envput upload`
Uploads an environment file to S3.

```bash
# Upload with environment selection prompt
npx envput upload

# Upload specific environment
npx envput upload production
# or
npx envput upload -e production
```

### `envput download`
Downloads an environment file from S3.

```bash
# Download with environment selection prompt
npx envput download

# Download specific environment
npx envput download production
# or
npx envput download -e production
```

## Usage Examples

### Team Development Workflow

1. **Project Lead Setup:**
```bash
# Initialize configuration
npx envput init

# Configure development and production environments
# Add .envputrc to .gitignore
echo ".envputrc" >> .gitignore

# Upload environments
npx envput upload development
npx envput upload production
```

2. **Team Members:**
```bash
# Create their own .envputrc with same AWS creds and environment configs
npx envput init

# Download the environments they need
npx envput download development
```

### Multiple Environment Management

```bash
# Upload all environments
npx envput upload development
npx envput upload staging  
npx envput upload production

# Download specific environment on deployment server
npx envput download production
```

### CI/CD Integration

```bash
# In your CI/CD pipeline
echo $ENVPUTRC_CONTENT > .envputrc
npx envput download production
# Now your .env.production file is available
```

## Security

> **⚠️ CRITICAL WARNING: BACKUP YOUR ENCRYPTION KEY!**
> 
> **If you lose your `.envputrc` file or the `encryptionKey` inside it, you will PERMANENTLY lose access to ALL your encrypted environment files in S3. There is NO way to recover them.**
> 
> **💾 BACKUP STRATEGIES:**
> - Store `.envputrc` in a secure password manager (1Password, Bitwarden, etc.)
> - Keep encrypted backups in multiple secure locations  
> - Share the key securely with your team through encrypted channels
> - Consider using a company secret management system for the key
> 
> **🚨 DO NOT:**
> - Rely on only one copy of `.envputrc`
> - Store it only on your local machine
> - Commit it to git (it's in `.gitignore` for a reason!)
> - Share it through unencrypted channels (email, Slack, etc.)

### Encryption Details

- **Encryption**: Files are encrypted using AES-256-CBC with a 256-bit key
- **Auto-Generated Keys**: Secure encryption key is automatically generated during `envput init`
- **Salt & IV**: Each encryption uses a random salt and initialization vector
- **Server-side Encryption**: S3 objects are additionally encrypted server-side with AES256
- **Single Key**: One encryption key per project (stored in `.envputrc` - add to .gitignore!)
- **No Manual Passwords**: No need to remember or manage individual passwords

## AWS Setup

You need an AWS account with S3 access. Create an IAM user with the following policy:

### **Required IAM Policy**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BucketAccess",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name"
    },
    {
      "Sid": "ObjectAccess",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:HeadObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

**⚠️ Important:** Replace `your-bucket-name` with your actual S3 bucket name.

### **Common Issues**

- **Missing `/*`**: The object resource ARN must end with `/*` to access objects inside the bucket
- **Wrong bucket name**: Ensure the bucket name in the policy matches your actual bucket
- **Missing permissions**: You need both bucket-level (`s3:ListBucket`) and object-level permissions

### **Alternative: Full S3 Access (Less Secure)**

If you want broader S3 access for testing:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}
```



## API Usage

You can also use envput programmatically:

```typescript
import { readConfig, uploadCommand, downloadCommand } from 'envput';

// Read configuration
const config = readConfig();

// Upload environment
await uploadCommand('production', { environment: 'production' });

// Download environment  
await downloadCommand('production', { environment: 'production' });
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Development mode (watch)
npm run dev

# Test
npm test

# Clean
npm run clean
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For a major modification, please submit an issue first so we can discuss.

## License

MIT