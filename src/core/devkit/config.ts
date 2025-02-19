import fs from 'fs';
import path from 'path';
import stripComments from 'strip-json-comments';
import yaml from 'js-yaml';
import { DEVKIT_CONFIG } from '../../shared/constant';

export default class Config {

  public ctx: any;
  constructor(ctx: any) {
    this.ctx = ctx;
  }

  loadConfig() {
    const directoryPath = process.cwd();
    for (const filename of DEVKIT_CONFIG) {
      const filePath = path.join(directoryPath, filename);

      if (fs.existsSync(filePath)) {
        let configData;

        try {
          configData = this.loadConfigFile(filePath);
        } catch (error) {
          if (!error || error.code !== "FEFLOW_CONFIG_FIELD_NOT_FOUND") {
            throw error;
          }
        }

        if (configData) {
          this.ctx.logger.debug(`Config file found: ${filePath}`);
          this.ctx.logger.debug('config data', configData);

          return configData;
        }
      }
    }

    this.ctx.logger.debug(`Config file not found on ${directoryPath}`);
    return null;
  }

  loadConfigFile(filePath: string) {
    switch (path.extname(filePath)) {
      case ".js":
        return this.loadJSConfigFile(filePath);

      case ".json":
        if (path.basename(filePath) === "package.json") {
          return this.loadPackageJSONConfigFile(filePath);
        }
        return this.loadJSONConfigFile(filePath);

      case ".yaml":
      case ".yml":
        return this.loadYAMLConfigFile(filePath);

      default:
        return this.loadLegacyConfigFile(filePath);
    }
  }

  loadJSConfigFile(filePath: string) {
    this.ctx.logger.debug(`Loading JS config file: ${filePath}`);
    try {

    } catch (e) {
      this.ctx.logger.debug(`Error reading JavaScript file: ${filePath}`);
      e.message = `Cannot read config file: ${filePath}\nError: ${e.message}`;
      throw e;
    }
  }

  loadYAMLConfigFile(filePath: string) {
    this.ctx.logger.debug(`Loading YAML config file: ${filePath}`);
    try {
      return yaml.safeLoad(this.readFile(filePath)) || {};
    } catch (e) {
      this.ctx.logger.debug(`Error reading YAML file: ${filePath}`);
      e.message = `Cannot read config file: ${filePath}\nError: ${e.message}`;
      throw e;
    }
  }

  loadPackageJSONConfigFile(filePath: string) {
    this.ctx.logger.debug(`Loading package.json config file: ${filePath}`);
    try {
      const packageData = this.loadJSONConfigFile(filePath);

      if (!Object.hasOwnProperty.call(packageData, "feflowConfig")) {
        throw Object.assign(
          new Error("package.json file doesn't have 'feflowConfig' field."),
          { code: "FEFLOW_CONFIG_FIELD_NOT_FOUND" }
        );
      }

      return packageData.feflowConfig;
    } catch (e) {
      this.ctx.logger.debug(`Error reading package.json file: ${filePath}`);
      e.message = `Cannot read config file: ${filePath}\nError: ${e.message}`;
      throw e;
    }
  }

  loadJSONConfigFile(filePath: string) {
    this.ctx.logger.debug(`Loading JSON config file: ${filePath}`);

    try {
      return JSON.parse(stripComments(this.readFile(filePath)));
    } catch (e) {
      this.ctx.logger.debug(`Error reading JSON file: ${filePath}`);
      e.message = `Cannot read config file: ${filePath}\nError: ${e.message}`;
      e.messageTemplate = "failed-to-read-json";
      e.messageData = {
        path: filePath,
        message: e.message
      };
      throw e;
    }
  }

  loadLegacyConfigFile(filePath: string) {
    this.ctx.logger.debug(`Loading legacy config file: ${filePath}`);
    try {
      return yaml.safeLoad(stripComments(this.readFile(filePath))) || {};
    } catch (e) {
      this.ctx.logger.debug("Error reading YAML file: %s\n%o", filePath, e);
      e.message = `Cannot read config file: ${filePath}\nError: ${e.message}`;
      throw e;
    }
  }

  readFile(filePath: string) {
    return fs.readFileSync(filePath, "utf8").replace(/^\ufeff/u, "");
  }
}