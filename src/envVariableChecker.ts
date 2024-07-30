import * as ts from "typescript";
import { Logger } from './types';
import { createSourceFile } from "./fileUtils";
import fs from "fs";

const findEnvVariables = (sourceFile: ts.SourceFile, log: Logger, errors: string[], warnings: string[], showDefaultValues: boolean): number => {
  let errorCount = 0;
  const processedVars = new Set<string>();
  const visitor = (node: ts.Node): void => {
    if (ts.isPropertyAccessExpression(node) &&
        node.expression.getText() === 'process.env') {
      const envVar = node.name.getText();
      if (!processedVars.has(envVar)) {
        processedVars.add(envVar);
        log(`Checking environment variable: ${envVar}`);
        checkEnvVariable(envVar, node, sourceFile, log, errors, warnings, showDefaultValues);
        errorCount += errors.length > 0 ? 1 : 0;
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
  warnings: string[],
  showDefaultValues: boolean
): void => {
  const isEnvVarSet = process.env[variable] !== undefined && process.env[variable] !== "";

  const createMessage = (type: string, message: string) =>
    `${type}: ${message}\nFile: ${sourceFile.fileName}\nLine: ${sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;

  const extractDefaultValue = (node: ts.Node): string | undefined => {
    let current = node;
    while (current.parent) {
      if (ts.isBinaryExpression(current.parent) &&
          (current.parent.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
           current.parent.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)) {
        return current.parent.right.getText();
      }
      if (ts.isConditionalExpression(current.parent)) {
        return current.parent.whenFalse.getText();
      }
      if (ts.isVariableDeclaration(current.parent) && current.parent.initializer) {
        if (!ts.isPropertyAccessExpression(current.parent.initializer) ||
            current.parent.initializer.expression.getText() !== 'process.env') {
          return current.parent.initializer.getText();
        }
      }
      if (ts.isBinaryExpression(current.parent) &&
          current.parent.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken) {
        return `${current.parent.left.getText()} === ${current.parent.right.getText()}`;
      }
      current = current.parent;
    }
    return undefined;
  };

  const hasDefaultValue = (node: ts.Node): boolean => {
    let current = node;
    while (current.parent) {
      if (ts.isBinaryExpression(current.parent) &&
          (current.parent.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
           current.parent.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)) {
        return true;
      }
      if (ts.isConditionalExpression(current.parent)) {
        return true;
      }
      if (ts.isVariableDeclaration(current.parent) && current.parent.initializer) {
        if (ts.isPropertyAccessExpression(current.parent.initializer) &&
            current.parent.initializer.expression.getText() === 'process.env') {
          return false;
        }
        return true;
      }
      current = current.parent;
    }
    return false;
  };

  if (!isEnvVarSet) {
    if (hasDefaultValue(node)) {
      let warningMessage = createMessage("Warning", `Environment variable ${variable} is not set, but has a default value.`);
      if (showDefaultValues) {
        const defaultValue = extractDefaultValue(node);
        if (defaultValue) {
          warningMessage += `\nDefault value: ${defaultValue}`;
        }
      }
      warnings.push(warningMessage);
    } else {
      const errorMessage = createMessage("Error", `Environment variable ${variable} is not set.`);
      errors.push(errorMessage);
    }
  }
};

export const processFiles = (
  files: string[],
  log: Logger,
  showDefaultValues: boolean
): { errors: string[], warnings: string[], errorCount: number } => {
  const errors: string[] = [];
  const warnings: string[] = [];
  let totalErrorCount = 0;

  for (const file of files) {
    const sourceFile = createSourceFile(file);
    const fileErrorCount = findEnvVariables(sourceFile, log, errors, warnings, showDefaultValues);
    totalErrorCount += fileErrorCount;
  }

  return { errors, warnings, errorCount: totalErrorCount };
};