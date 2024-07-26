import fs from 'fs';
import path from 'path';
import * as ts from 'typescript';

interface EnvSentinelOptions {
  debug?: boolean;
}

export default function envSentinel(options: EnvSentinelOptions | string = {}, projectPath: string = process.cwd()): void {
  let debug = false;
  if (typeof options === 'string') {
    projectPath = options;
  } else {
    debug = options.debug || false;
  }

  function log(...args: any[]) {
    if (debug) {
      console.log('[DEBUG]', ...args, '\n');
    }
  }

  log(`Checking environment variables in project path: ${projectPath}`);
  const files = getAllJSAndTSFiles(projectPath, log);
  log(`Found ${files.length} JS/TS files to process`);

  const errors: string[] = [];

  for (const file of files) {
    log(`Processing file: ${file}`);
    const sourceFile = ts.createSourceFile(
      file,
      fs.readFileSync(file, 'utf-8'),
      ts.ScriptTarget.Latest,
      true
    );

    let envVarsFound = 0;
    function visit(node: ts.Node) {
      if (ts.isPropertyAccessExpression(node) &&
          node.expression.getText() === 'process.env') {
        const envVar = node.name.getText();
        envVarsFound++;
        log(`Found environment variable: ${envVar}`);
        checkEnvVariable(envVar, node, sourceFile, log, errors);
      }
      ts.forEachChild(node, visit);
    }
    visit(sourceFile);
    log(`Found ${envVarsFound} environment variables in ${file}`);
  }

  if (errors.length > 0) {
    console.error('Errors found in environment variables:');
    errors.forEach(error => console.error(error));
    process.exit(1); // Gracefully stop the application
  }
}

export function getAllJSAndTSFiles(dir: string, log: (...args: any[]) => void): string[] {
  log(`Scanning directory: ${dir}`);
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      log(`Entering subdirectory: ${fullPath}`);
      files.push(...getAllJSAndTSFiles(fullPath, log));
    } else if (entry.isFile() && /\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      log(`Adding file: ${fullPath}`);
      files.push(fullPath);
    }
  }

  return files;
}

export function checkEnvVariable(variable: string, node: ts.Node, sourceFile: ts.SourceFile, log: (...args: any[]) => void, errors: string[]): void {
  log(`Checking environment variable: ${variable}`);
  const isEnvVarSet = variable in process.env && process.env[variable] !== '';

  if (!isEnvVarSet) {
    const errorMessage = `Error: Environment variable ${variable} is not set.\nFile: ${sourceFile.fileName}\nLine: ${sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;
    errors.push(errorMessage);
  } else {
    log(`Environment variable ${variable} is set and not empty`);
  }

  // Check for OR operator only if the environment variable is not set
  if (!isEnvVarSet && node.parent && ts.isBinaryExpression(node.parent) && node.parent.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
    const warningMessage = `Warning: Environment variable ${variable} has an OR operator. It might not be set.\nFile: ${sourceFile.fileName}\nLine: ${sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;
    console.warn(warningMessage);
  }
}