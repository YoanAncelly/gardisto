import { getAllJSAndTSFiles, createSourceFile } from '../fileUtils';
import fs from 'fs';
import path from 'path';
import * as ts from 'typescript';

jest.mock('fs');
jest.mock('path');

describe('fileUtils', () => {
  describe('getAllJSAndTSFiles', () => {
    const mockLogger = jest.fn();

    beforeEach(() => {
      jest.clearAllMocks();
      (fs.readdirSync as jest.Mock).mockReturnValue([]);
      (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
      (path.relative as jest.Mock).mockImplementation((from, to) => to);
    });

    it('should return an empty array when no files are found', () => {
      const result = getAllJSAndTSFiles('/test/dir', mockLogger);
      expect(result).toEqual([]);
    });

    it('should return JS and TS files', () => {
      (fs.readdirSync as jest.Mock).mockReturnValue([
        { name: 'file1.js', isDirectory: () => false, isFile: () => true },
        { name: 'file2.ts', isDirectory: () => false, isFile: () => true },
        { name: 'file3.txt', isDirectory: () => false, isFile: () => true },
      ]);

      const result = getAllJSAndTSFiles('/test/dir', mockLogger);
      expect(result).toEqual(['/test/dir/file1.js', '/test/dir/file2.ts']);
    });

    // Add more tests for include/exclude patterns, directory traversal, etc.
  });

  describe('createSourceFile', () => {
    it('should create a SourceFile object', () => {
      const mockFileContent = 'const x = 5;';
      (fs.readFileSync as jest.Mock).mockReturnValue(mockFileContent);

      const result = createSourceFile('test.ts');

      expect(ts.isSourceFile(result)).toBe(true);
      expect(result.fileName).toBe('test.ts');
      expect(result.text).toBe(mockFileContent);
    });
  });
});