import * as ts from "typescript";
import { Logger } from './types';
import { createSourceFile } from "./fileUtils";
import fs from "fs";

const findEnvVariables = (sourceFile: ts.SourceFile, log: Logger, errors: string[], warnings: string[]): number => {
  let errorCount = 0;
  const processedVars = new Set<string>();
  const visitor = (node: ts.Node): void => {
    if (ts.isPropertyAccessExpression(node) &&
        node.expression.getText() === 'process.env') {
      const envVar = node.name.getText();
      if (!processedVars.has(envVar)) {
        processedVars.add(envVar);
        log(`Found environment variable: ${envVar}`);
        const initialErrorCount = errors.length;
        const initialWarningCount = warnings.length;
        checkEnvVariable(envVar, node, sourceFile, log, errors, warnings);
        if (errors.length > initialErrorCount) {
          errorCount++;
        }
      }
    }
    ts.forEachChild(node, visitor);
  };
  ts.forEachChild(sourceFile, visitor);
  return errorCount;
};

const checkEnvVariable = (
  variable: string,
  node: ts.Node,
  sourceFile: ts.SourceFile,
  log: Logger,
  errors: string[],
  warnings: string[]
): void => {
  log(`Checking environment variable: ${variable}`);
  const isEnvVarSet = process.env[variable] !== undefined && process.env[variable] !== "";

  const createMessage = (type: string, message: string) =>
    `${type}: ${message}\nFile: ${sourceFile.fileName}\nLine: ${sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;

  const hasDefaultValue = (node: ts.Node): boolean => {
    let current = node;
    while (current.parent) {
      if (ts.isBinaryExpression(current.parent) &&
          (current.parent.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
           current.parent.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)) {
        log(`${variable} has OR operator (|| or ??)`);
        return true;
      }
      if (ts.isConditionalExpression(current.parent)) {
        log(`${variable} has conditional expression (?:)`);
        return true;
      }
      if (ts.isVariableDeclaration(current.parent) && current.parent.initializer) {
        // Check if the initializer is just process.env access
        if (ts.isPropertyAccessExpression(current.parent.initializer) &&
            current.parent.initializer.expression.getText() === 'process.env') {
          log(`${variable} does not have a default value`);
          return false;
        }
        log(`${variable} has default value assignment`);
        return true;
      }
      current = current.parent;
    }
    log(`${variable} does not have a default value`);
    return false;
  };

  if (!isEnvVarSet) {
    if (hasDefaultValue(node)) {
      const warningMessage = createMessage("Warning", `Environment variable ${variable} is not set, but has a default value.`);
      warnings.push(warningMessage);
    } else {
      const errorMessage = createMessage("Error", `Environment variable ${variable} is not set.`);
      errors.push(errorMessage);
    }
  } else {
    log(`Environment variable ${variable} is set and not empty`);
  }
};

export const processFiles = (
  files: string[],
  log: Logger,
): { errors: string[], warnings: string[], errorCount: number } => {
  const errors: string[] = [];
  const warnings: string[] = [];
  let totalErrorCount = 0;

  for (const file of files) {
    log(`Processing file: ${file}`);
    const sourceFile = ts.createSourceFile(
      file,
      fs.readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true
    );
    const fileErrorCount = findEnvVariables(sourceFile, log, errors, warnings);
    totalErrorCount += fileErrorCount;
    log(`Found ${fileErrorCount} environment variable errors in ${file}`);
  }

  return { errors, warnings, errorCount: totalErrorCount };
};