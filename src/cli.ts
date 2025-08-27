import { Command } from "commander";
import {
  uploadCommand,
  downloadCommand,
  initConfig,
  listCommand,
} from "./commands";

const packageJson = require("../package.json");

const program = new Command();

program
  .name("envput")
  .description(
    "Securely upload and download encrypted environment files to/from S3 using configuration files"
  )
  .version(packageJson.version);

program
  .command("init")
  .description("Create a new .envputrc configuration file")
  .action(initConfig);

program
  .command("list")
  .alias("ls")
  .description("List all configured environments")
  .action(listCommand);

program
  .command("upload [environment]")
  .description("Upload an environment to S3")
  .option("-e, --environment <name>", "Environment name to upload")
  .option("-a, --all", "Upload all configured environments")
  .action(uploadCommand);

program
  .command("download [environment]")
  .description("Download an environment from S3")
  .option("-e, --environment <name>", "Environment name to download")
  .option("-a, --all", "Download all configured environments")
  .action(downloadCommand);

program.parse();
