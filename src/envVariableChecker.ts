import * as ts from "typescript";
import { Logger } from './types';
import { createSourceFile } from "./fileUtils";
import fs from "fs";

// Function to find and check environment variables in a TypeScript source file
const findEnvVariables = (sourceFile: ts.SourceFile, log: Logger, errors: string[], warnings: string[], showDefaultValues: boolean): number => {
  let errorCount = 0;
  const processedVars = new Set<string>();

  // Recursive function to visit all nodes in the AST
  const visitor = (node: ts.Node): void => {
    // Check if the node is accessing process.env
    if (ts.isPropertyAccessExpression(node) &&
        node.expression.getText() === 'process.env') {
      const envVar = node.name.getText();
      // Process each env variable only once
      if (!processedVars.has(envVar)) {
        processedVars.add(envVar);
        log(`Checking environment variable: ${envVar}`);
        const isError = checkEnvVariable(envVar, node, sourceFile, log, errors, warnings, showDefaultValues);
        if (isError) {
          errorCount++;
        }
      }
    }
    // Continue traversing the AST
    ts.forEachChild(node, visitor);
  };

  // Start the AST traversal
  ts.forEachChild(sourceFile, visitor);
  return errorCount;
};

// Function to check a single environment variable
const checkEnvVariable = (
  variable: string,
  node: ts.Node,
  sourceFile: ts.SourceFile,
  log: Logger,
  errors: string[],
  warnings: string[],
  showDefaultValues: boolean
): boolean => {
  // Check if the env variable is set and not empty
  const isEnvVarSet = process.env[variable] !== undefined && process.env[variable].trim() !== "";

  // Helper function to create error/warning messages
  const createMessage = (type: string, message: string) =>
    `${type}: ${message}\nFile: ${sourceFile.fileName}\nLine: ${sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;

  // Function to extract the default value of an env variable
  const extractDefaultValue = (node: ts.Node): string | undefined => {
    let current = node;
    while (current && current.parent) {
      // Check for || or ?? operators
      if (ts.isBinaryExpression(current.parent) &&
          (current.parent.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
           current.parent.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)) {
        return current.parent.right.getText();
      }
      // Check for ternary operator
      if (ts.isConditionalExpression(current.parent)) {
        return current.parent.whenFalse.getText();
      }
      // Check for variable declaration with initializer
      if (ts.isVariableDeclaration(current.parent) && current.parent.initializer) {
        if (!ts.isPropertyAccessExpression(current.parent.initializer) ||
            current.parent.initializer.expression.getText() !== 'process.env') {
          return current.parent.initializer.getText();
        }
      }
      // Check for === comparison
      if (ts.isBinaryExpression(current.parent) &&
          current.parent.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken) {
        return `${current.parent.left.getText()} === ${current.parent.right.getText()}`;
      }
      current = current.parent;
    }
    return undefined;
  };

  // Function to check if the env variable has a default value
  const hasDefaultValue = (node: ts.Node): boolean => {
    let current = node;
    while (current.parent) {
      // Check for || or ?? operators
      if (ts.isBinaryExpression(current.parent) &&
          (current.parent.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
           current.parent.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken)) {
        return true;
      }
      // Check for ternary operator
      if (ts.isConditionalExpression(current.parent)) {
        return true;
      }
      // Check for variable declaration with initializer
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

  // If the env variable is not set, check for default values and add warnings/errors
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
      return false;
    } else {
      const errorMessage = createMessage("Error", `Environment variable ${variable} is not set.`);
      errors.push(errorMessage);
      return true;
    }
  }
  return false;
};

// Main function to process multiple files
export const processFiles = (
  files: string[],
  log: Logger,
  showDefaultValues: boolean
): { errors: string[], warnings: string[], errorCount: number } => {
  const errors: string[] = [];
  const warnings: string[] = [];
  let totalErrorCount = 0;

  // Process each file
  for (const file of files) {
    const sourceFile = createSourceFile(file);
    const fileErrorCount = findEnvVariables(sourceFile, log, errors, warnings, showDefaultValues);
    totalErrorCount += fileErrorCount;
  }

  return { errors, warnings, errorCount: totalErrorCount };
};