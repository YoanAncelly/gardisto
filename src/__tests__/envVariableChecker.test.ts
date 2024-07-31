import * as ts from 'typescript';
import { processFiles } from '../envVariableChecker';
import * as fileUtils from '../fileUtils';

jest.mock('../fileUtils');

describe('envVariableChecker', () => {
  const mockLogger = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {};
  });

  const createMockSourceFile = (content: string): ts.SourceFile => {
    return ts.createSourceFile('test.ts', content, ts.ScriptTarget.Latest, true);
  };

  describe('processFiles', () => {
    it('should process files and return results', () => {
      const mockSourceFile = createMockSourceFile('const x = process.env.TEST_VAR;');
      (fileUtils.createSourceFile as jest.Mock).mockReturnValue(mockSourceFile);

      const result = processFiles(['test.ts'], mockLogger, false);

      expect(result).toEqual({
        errors: [expect.stringContaining('Error: Environment variable TEST_VAR is not set.')],
        warnings: [],
        errorCount: 1
      });
    });

    it('should handle variables with default values', () => {
      const mockSourceFile = createMockSourceFile('const x = process.env.TEST_VAR || "default";');
      (fileUtils.createSourceFile as jest.Mock).mockReturnValue(mockSourceFile);

      const result = processFiles(['test.ts'], mockLogger, false);

      expect(result).toEqual({
        errors: [],
        warnings: [expect.stringContaining('Warning: Environment variable TEST_VAR is not set, but has a default value.')],
        errorCount: 0
      });
    });

    it('should show default values when showDefaultValues is true', () => {
      const mockSourceFile = createMockSourceFile('const x = process.env.TEST_VAR || "default";');
      (fileUtils.createSourceFile as jest.Mock).mockReturnValue(mockSourceFile);

      const result = processFiles(['test.ts'], mockLogger, true);

      expect(result).toEqual({
        errors: [],
        warnings: [expect.stringContaining('Default value: "default"')],
        errorCount: 0
      });
    });

    it('should handle multiple files', () => {
      const mockSourceFile1 = createMockSourceFile('const x = process.env.TEST_VAR1;');
      const mockSourceFile2 = createMockSourceFile('const y = process.env.TEST_VAR2 || "default";');
      (fileUtils.createSourceFile as jest.Mock)
        .mockReturnValueOnce(mockSourceFile1)
        .mockReturnValueOnce(mockSourceFile2);

      const result = processFiles(['test1.ts', 'test2.ts'], mockLogger, false);

      expect(result).toEqual({
        errors: [expect.stringContaining('Error: Environment variable TEST_VAR1 is not set.')],
        warnings: [expect.stringContaining('Warning: Environment variable TEST_VAR2 is not set, but has a default value.')],
        errorCount: 1
      });
    });

    it('should handle different types of variable usage', () => {
      const mockSourceFile = createMockSourceFile(`
        const a = process.env.VAR_A ?? "default";
        const b = process.env.VAR_B ? process.env.VAR_B : "default";
        const c = process.env.VAR_C === "test" ? "yes" : "no";
      `);
      (fileUtils.createSourceFile as jest.Mock).mockReturnValue(mockSourceFile);

      const result = processFiles(['test.ts'], mockLogger, true);

      expect(result).toEqual({
        errors: [],
        warnings: [
          expect.stringContaining('Default value: "default"'),
          expect.stringContaining('Default value: "default"'),
          expect.stringContaining('Default value: process.env.VAR_C === "test"'),
        ],
        errorCount: 0
      });
    });

    it('should not report errors for set environment variables', () => {
      process.env.TEST_VAR = 'set';
      const mockSourceFile = createMockSourceFile('const x = process.env.TEST_VAR;');
      (fileUtils.createSourceFile as jest.Mock).mockReturnValue(mockSourceFile);

      const result = processFiles(['test.ts'], mockLogger, false);

      expect(result).toEqual({
        errors: [],
        warnings: [],
        errorCount: 0
      });
    });
  });
});