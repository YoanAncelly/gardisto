import { GardistoOptions, Logger } from "./types";
import { createLogger } from "./logger";
import { getAllJSAndTSFiles } from "./fileUtils";
import { processFiles } from "./envVariableChecker";
import path from 'path';

const handleResults = (errors: string[], warnings: string[], errorCount: number): void => {
  if (warnings.length > 0) {
    console.warn("Warnings for environment variables:");
    warnings.forEach((warning) => console.warn(warning));
    console.warn(); // Add blank line for readability
  }

  if (errorCount > 0) {
    console.error("Errors found in environment variables:");
    errors.forEach((error) => console.error(error));
    console.error(); // Add blank line for readability
    process.exit(1);
  } else if (warnings.length === 0) {
    console.log("No environment variable issues found.");
  }
};

export const gardisto = (options: GardistoOptions = {}): void => {
  const log = createLogger(options.debug ?? false);
  const projectPath = options.projectPath ?? process.cwd();
  const absoluteProjectPath = path.resolve(projectPath);

  log(`Checking environment variables in project path: ${absoluteProjectPath}`);
  const files = getAllJSAndTSFiles(absoluteProjectPath, log, options.include ?? [], options.exclude ?? []);
  log(`Processing ${files.length} JS/TS files`);

  const { errors, warnings, errorCount } = processFiles(files, log, options.showDefaultValues ?? false);

  handleResults(errors, warnings, errorCount);
};