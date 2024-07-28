import * as ts from "typescript";
import { Logger } from './types';
import { createSourceFile } from "./fileUtils";

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

const checkEnvVariable = (
  variable: string,
  node: ts.Node,
  sourceFile: ts.SourceFile,
  log: Logger,
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

export const processFiles = (
  files: string[],
  log: Logger,
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
