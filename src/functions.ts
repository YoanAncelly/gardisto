import fs from "fs";
import path from "path";
import * as ts from "typescript";

interface CheckEnvVariablesOptions {
  debug?: boolean;
  include?: string[];
  exclude?: string[];
}

export const checkEnvVariables = (
  options: CheckEnvVariablesOptions | string = {},
  projectPath: string = process.cwd(),
): string[] => {
  const { debug, path, include, exclude } = parseOptions(options, projectPath);
  const log = createLogger(debug);

  log(`Checking environment variables in project path: ${path}`);
  const files = getAllJSAndTSFiles(path, log, include, exclude);
  log(`Found ${files.length} JS/TS files to process`);

  const errors = processFiles(files, log);

  handleErrors(errors);
  return errors;
};

const parseOptions = (
  options: CheckEnvVariablesOptions | string,
  defaultPath: string,
): { debug: boolean; path: string; include: string[]; exclude: string[] } => {
  if (typeof options === "string") {
    return { debug: false, path: options, include: [], exclude: [] };
  }
  return {
    debug: options.debug ?? false,
    path: defaultPath,
    include: options.include ?? [],
    exclude: options.exclude ?? [],
  };
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

const matchPattern = (filePath: string, pattern: string): boolean =>
  new RegExp(pattern.replace('*', '.*')).test(filePath);

const shouldCheckFile = (filePath: string, include: string[], exclude: string[]): boolean =>
  (include.length === 0 || include.some(pattern => matchPattern(filePath, pattern))) &&
  !exclude.some(pattern => matchPattern(filePath, pattern));

export const getAllJSAndTSFiles = (
  dir: string,
  log: (...args: unknown[]) => void,
  include: string[],
  exclude: string[],
): string[] => {
  log(`Scanning directory: ${dir}`);
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  return entries.flatMap(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules") {
      log(`Entering subdirectory: ${fullPath}`);
      return getAllJSAndTSFiles(fullPath, log, include, exclude);
    } else if (entry.isFile() && /\.(js|jsx|ts|tsx)$/.test(entry.name) && shouldCheckFile(fullPath, include, exclude)) {
      log(`Adding file: ${fullPath}`);
      return [fullPath];
    }
    return [];
  });
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