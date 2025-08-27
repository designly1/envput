# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2024-12-19

### Added
- **Batch Operations**: Added `--all` flag for upload and download commands to process all configured environments at once
- **Positional Arguments**: Support for environment names as positional arguments (e.g., `npx envput upload production`)
- **Bucket Path Configuration**: Added `bucketPath` option in `.envputrc` to organize files in S3 subdirectories (defaults to `/`)
- **Enhanced Security Warnings**: Added critical warnings about encryption key backup importance during `init` and in README
- **IAM Policy Documentation**: Added required AWS IAM policy examples and troubleshooting guide
- **MIT License**: Added `LICENSE.md` file

### Changed
- **Simplified Encryption Model**: Switched from individual passwords per environment to a single auto-generated encryption key per project
- **Project-Based S3 Paths**: Replaced individual S3 key paths with `projectName` property that constructs paths as `bucketPath/projectName/environmentName`
- **Improved Error Handling**: Enhanced error messages and path normalization to prevent double slashes in S3 paths
- **Batch Operation Safety**: For `--all` operations, existing files are skipped with informative messages to prevent accidental overwrites

### Removed
- **Legacy Commands**: Removed all deprecated individual option commands (`upload-legacy`, `download-legacy`)
- **Individual Environment Keys**: Removed `key` and `password` fields from environment configurations
- **Migration Documentation**: Cleaned up README by removing references to old/deprecated functionality

## [1.0.1] - 2024-12-19

### Fixed
- **TypeScript Compilation**: Fixed import issues with Node.js crypto module
- **Dependency Compatibility**: Resolved inquirer.js version compatibility issues
- **Build Configuration**: Corrected webpack bundling for CLI and library outputs

## [1.0.0] - 2024-12-19

### Added
- **Initial Release**: Secure CLI tool for encrypting and uploading environment files to AWS S3
- **Configuration File System**: `.envputrc` JSON configuration file for managing AWS credentials and multiple environments
- **Strong Encryption**: AES-256-CBC encryption with PBKDF2 key derivation
- **Interactive CLI**: Commands with interactive prompts for missing options
- **Multiple Environment Support**: Manage multiple environment files (dev, staging, production) from a single configuration
- **AWS S3 Integration**: Secure upload/download to AWS S3 with proper IAM policy requirements

### Commands
- `envput init` - Create new configuration file
- `envput list` - List all configured environments  
- `envput upload [environment]` - Upload environment file to S3
- `envput download [environment]` - Download environment file from S3

### Features
- **TypeScript**: Full TypeScript support with type definitions
- **Webpack Bundling**: Optimized builds for both CLI and library usage
- **Node.js Compatibility**: Supports Node.js 16.0.0 and higher
- **npm Package**: Installable via `npx envput` for immediate usage
- **Security First**: Auto-generated encryption keys and secure S3 storage

## [Unreleased]

### Planned
- Configuration validation and migration tools
- Environment file templates
- Backup and restore functionality
- Team collaboration features
- Integration with CI/CD pipelines

---

For more information about each release, see the [GitHub releases page](https://github.com/username/envput/releases).
