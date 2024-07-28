import { GardistoOptions, Logger } from "./types";
import { createLogger } from "./logger";
import { getAllJSAndTSFiles } from "./fileUtils";
import { processFiles } from "./envVariableChecker";

export class Gardisto {
  private log: Logger;

  constructor(private options: GardistoOptions = {}) {
    this.log = createLogger(options.debug ?? false);
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
    } else {
      this.log("No environment variable issues found.");
    }
  }

  public run(projectPath: string = process.cwd()): void {
    this.log(`Checking environment variables in project path: ${projectPath}`);
    const files = getAllJSAndTSFiles(projectPath, this.log, this.options.include ?? [], this.options.exclude ?? []);
    this.log(`Found ${files.length} JS/TS files to process`);

    const { errors, warnings, errorCount } = processFiles(files, this.log);

    this.handleResults(errors, warnings, errorCount);
  }
}