import fs from "fs";
import path from "path";
import { Logger } from './types';
import ts from "typescript";

// Helper function to check if a file path matches a given pattern
const isMatch = (filePath: string, pattern: string): boolean => {
  // Convert glob pattern to regex
  const regexPattern = pattern
    .split('*')
    .map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  // Test if the file path matches the regex pattern
  return new RegExp(`^${regexPattern}$`).test(filePath);
};

// Function to get all JavaScript and TypeScript files in a directory
export const getAllJSAndTSFiles = (
  dir: string,
  log: Logger,
  include: Array<`*.${string}`> = [],
  exclude: Array<`*.${string}`> = []
): string[] => {
  log('info', `Checking environment variables in project path: ${dir}`);
  const files: string[] = [];

  // Helper function to check if a file path is excluded
  const isExcluded = (filePath: string): boolean => {
    return exclude.some(pattern => isMatch(filePath, pattern));
  };

  // Helper function to check if a file path is included
  const isIncluded = (filePath: string): boolean => {
    return include.length === 0 || include.some(pattern => isMatch(filePath, pattern));
  };

  // Recursive function to scan directories
  const scanDirectory = (currentDir: string, isTopLevel: boolean = true) => {
    // Read all entries in the current directory
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relativePath = path.relative(process.cwd(), fullPath);

      // Skip excluded paths
      if (isExcluded(relativePath)) {
        if (isTopLevel) {
          log('info', `Skipping excluded path: ${relativePath}`);
        }
        continue;
      }

      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        scanDirectory(fullPath, false);
      } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.ts'))) {
        // Add JS and TS files that match the include patterns
        if (isIncluded(relativePath)) {
          files.push(fullPath);
        }
      }
    }
  };

  // Start scanning from the root directory
  scanDirectory(dir);
  return files;
};

// Function to create a TypeScript SourceFile object from a file path
export const createSourceFile = (filePath: string): ts.SourceFile =>
  ts.createSourceFile(
    filePath,
    fs.readFileSync(filePath, 'utf-8'),
    ts.ScriptTarget.Latest,
    true
  );
