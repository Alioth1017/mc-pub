import { Command } from "commander";
import { Options, PublishAction } from "./index";
const pkg = require("../package.json");
const program = new Command();

program
  .version(pkg.version)
  .description("mcp - A command line tool for publish.")
  .option(
    "-c, --configPath <configPath>",
    "json config file path",
    "./config.json"
  )
  .action(async (options: Options) => {
    new PublishAction(options).execute();
  });

program.parse(process.argv);
