import fs from "fs";
import path from "path";
import * as ts from "typescript";
import { Logger } from './types';

const matchPattern = (filePath: string, pattern: string): boolean =>
  new RegExp(pattern.replace('*', '.*')).test(filePath);

const shouldCheckFile = (filePath: string, include: string[], exclude: string[]): boolean =>
  (include.length === 0 || include.some(pattern => matchPattern(filePath, pattern))) &&
  !exclude.some(pattern => matchPattern(filePath, pattern));

export const getAllJSAndTSFiles = (
  dir: string,
  log: Logger,
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

export const createSourceFile = (filePath: string): ts.SourceFile =>
  ts.createSourceFile(filePath, fs.readFileSync(filePath, 'utf-8'), ts.ScriptTarget.Latest, true);
