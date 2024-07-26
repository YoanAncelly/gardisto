import fs from "fs";
import path from "path";
import * as ts from "typescript";

interface CheckEnvVariablesOptions {
  debug?: boolean;
}

export const checkEnvVariables = (
  options: CheckEnvVariablesOptions | string = {},
  projectPath: string = process.cwd(),
): string[] => {
  const { debug, path } = parseOptions(options, projectPath);
  const log = createLogger(debug);

  log(`Checking environment variables in project path: ${path}`);
  const files = getAllJSAndTSFiles(path, log);
  log(`Found ${files.length} JS/TS files to process`);

  const errors = processFiles(files, log);

  handleErrors(errors);
  return errors;
};

const parseOptions = (
  options: CheckEnvVariablesOptions | string,
  defaultPath: string,
): { debug: boolean; path: string } => {
  if (typeof options === "string") {
    return { debug: false, path: options };
  }
  return { debug: options.debug ?? false, path: defaultPath };
};

const createLogger = (debug: boolean) => (...args: unknown[]): void => {
  if (debug) {
    console.log("[DEBUG]", ...args, "\n");
  }
};

const createSourceFile = (filePath: string): ts.SourceFile =>
  ts.createSourceFile(filePath, fs.readFileSync(filePath, 'utf-8'), ts.ScriptTarget.Latest, true);

const findEnvVariables = (sourceFile: ts.SourceFile): string[] => {
  const envVars: string[] = [];
  const visitor = (node: ts.Node): void => {
    if (ts.isPropertyAccessExpression(node) &&
        node.expression.getText() === 'process.env') {
      const envVar = node.name.getText();
      envVars.push(envVar);
    }
    ts.forEachChild(node, visitor);
  };
  ts.forEachChild(sourceFile, visitor);
  return envVars;
};

const processFiles = (
  files: string[],
  log: (...args: unknown[]) => void,
): string[] => {
  const errors: string[] = [];
  for (const file of files) {
    log(`Processing file: ${file}`);
    const sourceFile = createSourceFile(file);
    const envVars = findEnvVariables(sourceFile);
    log(`Found ${envVars.length} environment variables in ${file}`);
    envVars.forEach(variable =>
      { checkEnvVariable(variable, sourceFile.getChildAt(0), sourceFile, log, errors) }
    );
  }
  return errors;
};

const handleErrors = (errors: string[]): void => {
  if (errors.length > 0) {
    console.error("Errors found in environment variables:");
    errors.forEach((error) => console.error(error));
    process.exit(1);
  }
};

export const getAllJSAndTSFiles = (
  dir: string,
  log: (...args: unknown[]) => void,
): string[] => {
  log(`Scanning directory: ${dir}`);
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules") {
      log(`Entering subdirectory: ${fullPath}`);
      files.push(...getAllJSAndTSFiles(fullPath, log));
    } else if (entry.isFile() && /\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      log(`Adding file: ${fullPath}`);
      files.push(fullPath);
    }
  }

  return files;
};

export const checkEnvVariable = (
  variable: string,
  node: ts.Node,
  sourceFile: ts.SourceFile,
  log: (...args: unknown[]) => void,
  errors: string[]
): void => {
  log(`Checking environment variable: ${variable}`);
  const isEnvVarSet = variable in process.env && process.env[variable] !== "";

  const createMessage = (type: string, message: string) =>
    `${type}: ${message}\nFile: ${sourceFile.fileName}\nLine: ${sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;

  const hasOrOperator = (node: ts.Node): boolean =>
    node.parent &&
    ts.isBinaryExpression(node.parent) &&
    (node.parent.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
     node.parent.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken);

  if (!isEnvVarSet) {
    if (hasOrOperator(node)) {
      const warningMessage = createMessage("Warning", `Environment variable ${variable} has an OR operator. It might not be set.`);
      console.warn(warningMessage);
    } else {
      const errorMessage = createMessage("Error", `Environment variable ${variable} is not set.`);
      errors.push(errorMessage);
    }
  } else {
    log(`Environment variable ${variable} is set and not empty`);
  }
};