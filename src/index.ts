import fs from 'fs';
import path from 'path';
import * as ts from 'typescript';

function checkEnvVariables(projectPath: string): void {
  const files = getAllTypeScriptFiles(projectPath);

  for (const file of files) {
    const sourceFile = ts.createSourceFile(
      file,
      fs.readFileSync(file, 'utf-8'),
      ts.ScriptTarget.Latest,
      true
    );

    ts.forEachChild(sourceFile, (node) => {
      if (ts.isPropertyAccessExpression(node) &&
          node.expression.getText() === 'process.env') {
        const envVar = node.name.getText();
        checkEnvVariable(envVar, node, sourceFile);
      }
    });
  }
}

function getAllTypeScriptFiles(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllTypeScriptFiles(fullPath));
    } else if (entry.isFile() && /\.tsx?$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function checkEnvVariable(variable: string, node: ts.Node, sourceFile: ts.SourceFile): void {
  if (!(variable in process.env)) {
    console.error(`Error: Environment variable ${variable} is not set.`);
    console.error(`File: ${sourceFile.fileName}`);
    console.error(`Line: ${sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1}`);
  } else if (process.env[variable] === '') {
    console.warn(`Warning: Environment variable ${variable} is empty.`);
    console.warn(`File: ${sourceFile.fileName}`);
    console.warn(`Line: ${sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1}`);
  }

  // Check for OR operator
  if (node.parent && ts.isBinaryExpression(node.parent) && node.parent.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
    console.warn(`Warning: Environment variable ${variable} has an OR operator. It might not be set.`);
    console.warn(`File: ${sourceFile.fileName}`);
    console.warn(`Line: ${sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1}`);
  }
}

export { checkEnvVariables };