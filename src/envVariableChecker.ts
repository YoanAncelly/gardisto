import * as ts from "typescript";
import {
  Logger,
  EnvCheckResult,
  CodeLocation,
  ProcessingResult,
  EnvError,
  EnvWarning,
} from './types';
import { createSourceFile } from "./fileUtils";

/** Cache for parsed source files to improve performance */
const sourceFileCache = new Map<string, ts.SourceFile>();

/** Patterns that might indicate environment variable access */
const ENV_ACCESS_PATTERNS = [
  'process.env',
  'process["env"]',
  "process['env']"
];

/** Common environment variable naming patterns */
const ENV_VAR_PATTERNS = {
  sensitive: /(key|secret|password|token)/i,
  url: /(url|uri|endpoint)/i,
  port: /^port$/i
};

/** URL protocols that are considered valid */
const VALID_URL_PROTOCOLS = [
  'http://',
  'https://',
  'mongodb://',
  'mongodb+srv://',
  'postgresql://',
  'mysql://',
  'redis://',
  'amqp://',
  'ws://',
  'wss://'
];

/** Get or create a cached source file */
const getCachedSourceFile = (filePath: string): ts.SourceFile => {
  if (!sourceFileCache.has(filePath)) {
    sourceFileCache.set(filePath, createSourceFile(filePath));
  }
  return sourceFileCache.get(filePath)!;
};

/** Check if a node represents environment variable access */
const isEnvAccess = (node: ts.Node): boolean => {
  const text = node.getText();
  return ENV_ACCESS_PATTERNS.some(pattern => text.includes(pattern));
};

/** Get variable name from node */
const getEnvVarName = (node: ts.PropertyAccessExpression | ts.ElementAccessExpression): string => {
  if (ts.isPropertyAccessExpression(node)) {
    return node.name.getText();
  }
  const argument = node.argumentExpression;
  if (ts.isStringLiteral(argument)) {
    return argument.text;
  }
  throw new Error('Unable to determine environment variable name');
};

/** Check for potential security issues */
const checkSecurityIssues = (
  variable: string,
  location: CodeLocation,
  result: ProcessingResult,
  debug: boolean
): void => {
  // Check for sensitive variables
  if (ENV_VAR_PATTERNS.sensitive.test(variable)) {
    result.warnings.push(new EnvWarning(
      variable,
      location,
      `Environment variable ${variable} appears to contain sensitive information. Ensure it's properly secured.`,
      debug
    ));
  }

  // Check for URL variables without valid protocol
  if (ENV_VAR_PATTERNS.url.test(variable)) {
    const value = process.env[variable];
    if (value && !VALID_URL_PROTOCOLS.some(protocol => value.startsWith(protocol))) {
      result.warnings.push(new EnvWarning(
        variable,
        location,
        `URL environment variable ${variable} should include a valid protocol (${VALID_URL_PROTOCOLS.join(', ')}).`,
        debug
      ));
    }
  }

  // Check for port variables with non-numeric values
  if (ENV_VAR_PATTERNS.port.test(variable)) {
    const value = process.env[variable];
    if (value && isNaN(Number(value))) {
      result.warnings.push(new EnvWarning(
        variable,
        location,
        `Port environment variable ${variable} should be a number.`,
        debug
      ));
    }
  }
};

/** Find and check environment variables in a TypeScript source file */
const findEnvVariables = (
  sourceFile: ts.SourceFile,
  log: Logger,
  result: ProcessingResult,
  showDefaultValues: boolean
): number => {
  let errorCount = 0;

  const visitor = (node: ts.Node): void => {
    try {
      if ((ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) &&
          isEnvAccess(node.expression)) {
        try {
          const envVar = getEnvVarName(node);
          if (!result.checkedVariables.has(envVar)) {
            result.checkedVariables.add(envVar);
            log('debug', `Checking environment variable: ${envVar}`);

            const checkResult = checkEnvVariable(envVar, node, sourceFile, showDefaultValues);

            // Check for missing variables
            if (!checkResult.exists) {
              errorCount++;
              result.errors.push(new EnvError(
                checkResult.variable,
                checkResult.location,
                `Missing required environment variable: ${envVar}`,
                showDefaultValues
              ));
            }

            // Check for default values
            if (checkResult.defaultValue) {
              result.warnings.push(new EnvWarning(
                checkResult.variable,
                checkResult.location,
                `Environment variable ${envVar} uses a default value: ${checkResult.defaultValue}`,
                showDefaultValues
              ));
            }

            // Perform security checks
            checkSecurityIssues(envVar, checkResult.location, result, showDefaultValues);
          }
        } catch (error) {
          log('error', `Error processing environment variable: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    } catch (error) {
      log('error', `Error visiting node: ${error instanceof Error ? error.message : String(error)}`);
      if (error instanceof Error) {
        result.errors.push(new EnvError(
          'unknown',
          getNodeLocation(node, sourceFile),
          `Error processing AST node: ${error.message}`,
          showDefaultValues
        ));
      }
    }
    ts.forEachChild(node, visitor);
  };

  ts.forEachChild(sourceFile, visitor);
  return errorCount;
};

/** Get location information from a node */
const getNodeLocation = (node: ts.Node, sourceFile: ts.SourceFile): CodeLocation => {
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  return {
    filePath: sourceFile.fileName,
    line: line + 1,
    column: character + 1
  };
};

/** Check a single environment variable */
const checkEnvVariable = (
  variable: string,
  node: ts.Node,
  sourceFile: ts.SourceFile,
  showDefaultValues: boolean
): EnvCheckResult => {
  const location = getNodeLocation(node, sourceFile);
  const value = process.env[variable];
  const exists = value !== undefined && value.trim() !== "";

  // Check for default values in various patterns
  let defaultValue: string | undefined;
  if (showDefaultValues && node.parent) {
    if (ts.isBinaryExpression(node.parent)) {
      const parentNode = node.parent;
      if (parentNode.operatorToken.kind === ts.SyntaxKind.BarBarToken ||
          parentNode.operatorToken.kind === ts.SyntaxKind.QuestionQuestionToken) {
        defaultValue = parentNode.right.getText();
      }
    } else if (ts.isConditionalExpression(node.parent)) {
      // Handle ternary operator
      const parentNode = node.parent;
      if (ts.isPropertyAccessExpression(parentNode.condition) &&
          parentNode.condition === node) {
        defaultValue = parentNode.whenFalse.getText();
      }
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

/** Process multiple files */
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

  // Process files in chunks for better memory management
  const CHUNK_SIZE = 50;
  for (let i = 0; i < files.length; i += CHUNK_SIZE) {
    const chunk = files.slice(i, i + CHUNK_SIZE);

    for (const file of chunk) {
      try {
        const sourceFile = getCachedSourceFile(file);
        const fileErrorCount = findEnvVariables(sourceFile, log, result, showDefaultValues);
        result.errorCount += fileErrorCount;
      } catch (error) {
        log('error', `Error processing file ${file}: ${error instanceof Error ? error.message : String(error)}`);
        if (error instanceof Error) {
          const fileError = new EnvError(
            'unknown',
            { filePath: file, line: 0, column: 0 },
            `Failed to process file: ${error.message}`,
            showDefaultValues
          );
          result.errors.push(fileError);
          result.errorCount++;
        }
      }
    }

    // Clear cache after each chunk to manage memory
    sourceFileCache.clear();
  }

  return result;
};