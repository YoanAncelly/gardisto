import * as ts from 'typescript';
import { LogLevel } from '../src/types';
import { processFiles } from '../src/envVariableChecker';
import { EnvironmentError } from '../src/errors';
import * as fs from 'fs';
import * as path from 'path';

// Mock filesystem
jest.mock('fs');
const mockedFs = jest.mocked(fs);

// Mock logger
const mockLogger = jest.fn();

describe('Environment Variable Checker', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    process.env = {};
  });

  describe('Variable Detection', () => {
    it('should detect process.env access patterns', async () => {
      const testCode = `
        const apiKey = process.env.API_KEY;
        const dbUrl = process["env"].DATABASE_URL;
        const port = process['env'].PORT;
      `;

      // Mock file system
      mockedFs.readFileSync.mockReturnValue(testCode);
      mockedFs.existsSync.mockReturnValue(true);

      const result = processFiles(['test.ts'], mockLogger, false);

      expect(result.checkedVariables.size).toBe(3);
      expect(result.errors).toHaveLength(3); // All variables are missing
      expect(result.errors[0].message).toContain('API_KEY');
      expect(result.errors[1].message).toContain('DATABASE_URL');
      expect(result.errors[2].message).toContain('PORT');
    });

    it('should detect environment variables with values', async () => {
      const testCode = `
        const apiKey = process.env.API_KEY;
      `;

      process.env.API_KEY = 'test-key';

      mockedFs.readFileSync.mockReturnValue(testCode);
      mockedFs.existsSync.mockReturnValue(true);

      const result = processFiles(['test.ts'], mockLogger, false);

      expect(result.errors).toHaveLength(0);
      expect(result.checkedVariables.size).toBe(1);
    });
  });

  describe('Security Checks', () => {
    it('should warn about sensitive variable names', async () => {
      const testCode = `
        const apiKey = process.env.API_SECRET_KEY;
        const token = process.env.AUTH_TOKEN;
        const password = process.env.DB_PASSWORD;
      `;

      process.env.API_SECRET_KEY = 'secret';
      process.env.AUTH_TOKEN = 'token';
      process.env.DB_PASSWORD = 'password';

      mockedFs.readFileSync.mockReturnValue(testCode);
      mockedFs.existsSync.mockReturnValue(true);

      const result = processFiles(['test.ts'], mockLogger, true);

      expect(result.warnings).toHaveLength(3);
      expect(result.warnings[0].message).toContain('sensitive information');
    });

    it('should warn about invalid URL formats', async () => {
      const testCode = `
        const dbUrl = process.env.DATABASE_URL;
      `;

      process.env.DATABASE_URL = 'invalid-url';

      mockedFs.readFileSync.mockReturnValue(testCode);
      mockedFs.existsSync.mockReturnValue(true);

      const result = processFiles(['test.ts'], mockLogger, true);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toContain('valid protocol');
    });

    it('should warn about invalid port values', async () => {
      const testCode = `
        const port = process.env.PORT;
      `;

      process.env.PORT = 'invalid-port';

      mockedFs.readFileSync.mockReturnValue(testCode);
      mockedFs.existsSync.mockReturnValue(true);

      const result = processFiles(['test.ts'], mockLogger, true);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toContain('should be a number');
    });
  });

  describe('Default Values', () => {
    it('should detect default values using ||', async () => {
      const testCode = `
        const port = process.env.PORT || '3000';
      `;

      mockedFs.readFileSync.mockReturnValue(testCode);
      mockedFs.existsSync.mockReturnValue(true);

      const result = processFiles(['test.ts'], mockLogger, true);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].message).toContain('uses a default value: \'3000\'');
    });

    it('should detect default values using ??', async () => {
      const testCode = `
        const apiUrl = process.env.API_URL ?? 'https://api.default.com';
      `;

      mockedFs.readFileSync.mockReturnValue(testCode);
      mockedFs.existsSync.mockReturnValue(true);

      const result = processFiles(['test.ts'], mockLogger, true);

      expect(result.warnings).toHaveLength(1); // Only expect default value warning
      expect(result.warnings[0].message).toContain('uses a default value');
    });
  });

  describe('Error Handling', () => {
    it('should handle file read errors', async () => {
      mockedFs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });
      mockedFs.existsSync.mockReturnValue(true);

      const result = processFiles(['test.ts'], mockLogger, false);

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Failed to process file');
    });

    it('should handle invalid TypeScript code', async () => {
      const invalidCode = `
        const apiKey = process.env.INVALID_SYNTAX.;
        const test = process.env.;
      `;

      mockedFs.readFileSync.mockReturnValue(invalidCode);
      mockedFs.existsSync.mockReturnValue(true);

      const result = processFiles(['test.ts'], mockLogger, false);

      // Verify that debug messages were logged
      expect(mockLogger).toHaveBeenCalledWith(
        LogLevel.DEBUG,
        expect.stringContaining('Checking environment variable')
      );

      // Verify that invalid variables were detected but marked as errors
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errorCount).toBeGreaterThan(0);
    });
  });

  describe('File Processing', () => {
    it('should process multiple files', async () => {
      const file1 = `const key1 = process.env.KEY_1;`;
      const file2 = `const key2 = process.env.KEY_2;`;

      mockedFs.readFileSync
        .mockReturnValueOnce(file1)
        .mockReturnValueOnce(file2);
      mockedFs.existsSync.mockReturnValue(true);

      const result = processFiles(['file1.ts', 'file2.ts'], mockLogger, false);

      expect(result.checkedVariables.size).toBe(2);
      expect(result.errors).toHaveLength(2);
    });

    it('should handle empty files', async () => {
      mockedFs.readFileSync.mockReturnValue('');
      mockedFs.existsSync.mockReturnValue(true);

      const result = processFiles(['empty.ts'], mockLogger, false);

      expect(result.checkedVariables.size).toBe(0);
      expect(result.errors).toHaveLength(0);
    });
  });
});
