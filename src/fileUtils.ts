import fs from "fs";
import path from "path";
import { Logger } from './types';
import ts from "typescript";

const isMatch = (filePath: string, pattern: string): boolean => {
  const regexPattern = pattern
    .split('*')
    .map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  return new RegExp(`^${regexPattern}$`).test(filePath);
};

export const getAllJSAndTSFiles = (
  dir: string,
  log: Logger,
  include: string[] = [],
  exclude: string[] = []
): string[] => {
  log(`Checking environment variables in project path: ${dir}`);
  const files: string[] = [];

  const isExcluded = (filePath: string): boolean => {
    return exclude.some(pattern => isMatch(filePath, pattern));
  };

  const isIncluded = (filePath: string): boolean => {
    return include.length === 0 || include.some(pattern => isMatch(filePath, pattern));
  };

  const scanDirectory = (currentDir: string, isTopLevel: boolean = true) => {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relativePath = path.relative(process.cwd(), fullPath);

      if (isExcluded(relativePath)) {
        if (isTopLevel) {
          log(`Skipping excluded path: ${relativePath}`);
        }
        continue;
      }

      if (entry.isDirectory()) {
        scanDirectory(fullPath, false);
      } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.ts'))) {
        if (isIncluded(relativePath)) {
          files.push(fullPath);
        }
      }
    }
  };

  scanDirectory(dir);
  return files;
};

export const createSourceFile = (filePath: string): ts.SourceFile =>
  ts.createSourceFile(filePath, fs.readFileSync(filePath, 'utf-8'), ts.ScriptTarget.Latest, true);