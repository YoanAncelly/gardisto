import { GardistoOptions, Logger } from "./types";
import { createLogger } from "./logger";
import { getAllJSAndTSFiles } from "./fileUtils";
import { processFiles } from "./envVariableChecker";
import path from 'path';

export class Gardisto {
  private log: Logger;
  private showDefaultValues: boolean;

  constructor(private options: GardistoOptions = {}) {
    this.log = createLogger(options.debug ?? false);
    this.showDefaultValues = options.showDefaultValues ?? false;
  }

  private handleResults(errors: string[], warnings: string[], errorCount: number): void {
    if (warnings.length > 0) {
      console.warn("Warnings for environment variables:");
      warnings.forEach((warning) => console.warn(warning));
    }

    if (errorCount > 0) {
      console.error("Errors found in environment variables:");
      errors.forEach((error) => console.error(error));
      process.exit(1);
    } else if (warnings.length === 0) {
      console.log("No environment variable issues found.");
    }
  }

  public run(projectPath: string = process.cwd()): void {
    const absoluteProjectPath = path.resolve(projectPath);
    this.log(`Checking environment variables in project path: ${absoluteProjectPath}`);
    const files = getAllJSAndTSFiles(absoluteProjectPath, this.log, this.options.include ?? [], this.options.exclude ?? []);
    this.log(`Processing ${files.length} JS/TS files`);

    const { errors, warnings, errorCount } = processFiles(files, this.log, this.showDefaultValues);

    this.handleResults(errors, warnings, errorCount);
  }
}