import * as ts from "typescript";
import { 
  Logger, 
  EnvCheckResult, 
  CodeLocation, 
  ProcessingResult,
  EnvError,
  EnvWarning,
  LogLevel 
} from './types';
import { createSourceFile } from "./fileUtils";
import fs from "fs";

// Function to find and check environment variables in a TypeScript source file
const findEnvVariables = (
  sourceFile: ts.SourceFile, 
  log: Logger, 
  result: ProcessingResult,
  showDefaultValues: boolean
): number => {
  let errorCount = 0;

  // Recursive function to visit all nodes in the AST
  const visitor = (node: ts.Node): void => {
    try {
      // Check if the node is accessing process.env
      if (ts.isPropertyAccessExpression(node) &&
          node.expression.getText() === 'process.env') {
        const envVar = node.name.getText();
        // Process each env variable only once
        if (!result.checkedVariables.has(envVar)) {
          result.checkedVariables.add(envVar);
          log('debug', `Checking environment variable: ${envVar}`);
          
          const checkResult = checkEnvVariable(envVar, node, sourceFile, showDefaultValues);
          if (!checkResult.exists) {
            errorCount++;
            result.errors.push(new EnvError(
              checkResult.variable,
              checkResult.location,
              `Missing required environment variable: ${envVar}`
            ));
          } else if (checkResult.defaultValue) {
            result.warnings.push(new EnvWarning(
              checkResult.variable,
              checkResult.location,
              `Environment variable ${envVar} uses a default value: ${checkResult.defaultValue}`
            ));
          }
        }
      }
    } catch (error) {
      log('error', `Error processing node: ${error instanceof Error ? error.message : String(error)}`);
      if (error instanceof Error) {
        result.errors.push(new EnvError(
          'unknown',
          getNodeLocation(node, sourceFile),
          `Error processing AST node: ${error.message}`
        ));
      }
    }
    // Continue traversing the AST
    ts.forEachChild(node, visitor);
  };

  // Start the AST traversal
  ts.forEachChild(sourceFile, visitor);
  return errorCount;
};

// Function to get location information from a node
const getNodeLocation = (node: ts.Node, sourceFile: ts.SourceFile): CodeLocation => {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  return {
    filePath: sourceFile.fileName,
    line: line + 1,
    column: character + 1
  };
};

// Function to check a single environment variable
const checkEnvVariable = (
  variable: string,
  node: ts.Node,
  sourceFile: ts.SourceFile,
  showDefaultValues: boolean
): EnvCheckResult => {
  const location = getNodeLocation(node, sourceFile);
  const value = process.env[variable];
  const exists = value !== undefined && value.trim() !== "";
  
  // Check for default value in parent node
  let defaultValue: string | undefined;
  if (showDefaultValues && node.parent && ts.isBinaryExpression(node.parent)) {
    const parentNode = node.parent;
    if (parentNode.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
      defaultValue = parentNode.right.getText();
    }
  }

  return {
    variable,
    exists,
    value: exists ? value : undefined,
    location,
    defaultValue
  };
};

// Main function to process multiple files
export const processFiles = (
  files: string[],
  log: Logger,
  showDefaultValues: boolean
): ProcessingResult => {
  const result: ProcessingResult = {
    errors: [],
    warnings: [],
    checkedVariables: new Set(),
    errorCount: 0
  };

  // Process each file
  for (const file of files) {
    const sourceFile = createSourceFile(file);
    const fileErrorCount = findEnvVariables(sourceFile, log, result, showDefaultValues);
    result.errorCount = (result.errorCount || 0) + fileErrorCount;
  }

  return result;
};