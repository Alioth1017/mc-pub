import { NotificationAction } from "notikit";
import { FtpUpload, Options as FTPOptions } from "ftpkit";
import * as fs from "fs/promises";
import * as path from "path";

export type Options = {
  configPath: string;
};

export class PublishAction {
  constructor(private options: Options) {}

  async execute() {
    const configPath = this.options.configPath || "./config.json";
    if (!configPath) {
      throw new Error("configPath is required");
    }
    const configContent = await fs.readFile(configPath, "utf-8");
    const config = JSON.parse(configContent);

    const env = process.env.BUILD_ENV;

    if (!env) {
      throw new Error("BUILD_ENV is required");
    }
    let ftpConfig = config?.ftp?.[env] as FTPOptions;
    if (!ftpConfig) {
      throw new Error(`config.ftp.${env} is required`);
    }

    // 修复一下 ftp 文件路径
    if (ftpConfig.localDir.startsWith(".")) {
      const configDir = path.dirname(configPath);
      const firstSeparatorIndex = ftpConfig.localDir.indexOf(path.sep);
      ftpConfig.localDir = path.resolve(
        configDir,
        ftpConfig.localDir.substring(firstSeparatorIndex + 1)
      );
    }
    new FtpUpload(ftpConfig).execute().then(() => {
      if (config.notice) {
        let { type, botKey, message } = config.notice;
        for (const [key, value] of Object.entries(process.env)) {
          message = message.replace(`\${${key}}`, value);
        }
        new NotificationAction({ type, botKey }).send(message);
      }
    });
  }
}
