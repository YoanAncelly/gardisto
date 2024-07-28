import { GardistoOptions, Logger } from "./types";
import { createLogger } from "./logger";
import { getAllJSAndTSFiles } from "./fileUtils";
import { processFiles } from "./envVariableChecker";

export class Gardisto {
  private log: Logger;

  constructor(private options: GardistoOptions = {}) {
    this.log = createLogger(options.debug ?? false);
  }

  private handleErrors(errors: string[]): void {
    if (errors.length > 0) {
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

    const errors = processFiles(files, this.log);

    this.handleErrors(errors);
  }
}