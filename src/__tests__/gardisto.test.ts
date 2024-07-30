import { gardisto } from '../gardisto';
import * as fileUtils from '../fileUtils';
import * as envVariableChecker from '../envVariableChecker';
import { GardistoOptions } from '../types';
import * as path from 'path';
import * as fs from 'fs';

jest.mock('../fileUtils');
jest.mock('../envVariableChecker');

describe('gardisto', () => {
  const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
  const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

  const testDir = path.join(__dirname, 'test-project');
  const testFile = path.join(testDir, 'test.ts');

  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    fs.writeFileSync(testFile, `
      const TEST_VAR = process.env.TEST_VAR || 'default-value';
      console.log(TEST_VAR);
    `);
  });

  afterAll(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (fileUtils.getAllJSAndTSFiles as jest.Mock).mockReturnValue([testFile]);
  });

  it('should run without errors when no issues are found', () => {
    (envVariableChecker.processFiles as jest.Mock).mockReturnValue({ errors: [], warnings: [], errorCount: 0 });

    gardisto({ projectPath: testDir });

    expect(mockConsoleLog).toHaveBeenCalledWith('No environment variable issues found.');
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should show default values when showDefaultValues is true', () => {
    (envVariableChecker.processFiles as jest.Mock).mockReturnValue({
      errors: [],
      warnings: ['Warning: Environment variable TEST_VAR is not set, but has a default value.\nDefault value: "default-value"'],
      errorCount: 0
    });

    gardisto({ showDefaultValues: true, projectPath: testDir });

    expect(mockConsoleWarn).toHaveBeenCalledWith('Warnings for environment variables:');
    expect(mockConsoleWarn).toHaveBeenCalledWith(expect.stringContaining('Warning: Environment variable TEST_VAR is not set, but has a default value.'));
    expect(mockConsoleWarn).toHaveBeenCalledWith(expect.stringContaining('Default value: "default-value"'));
  });

  it('should not show default values when showDefaultValues is false', () => {
    (envVariableChecker.processFiles as jest.Mock).mockReturnValue({
      errors: [],
      warnings: ['Warning: Environment variable TEST_VAR is not set, but has a default value.'],
      errorCount: 0
    });

    gardisto({ showDefaultValues: false, projectPath: testDir });

    expect(mockConsoleWarn).toHaveBeenCalledWith('Warnings for environment variables:');
    expect(mockConsoleWarn).toHaveBeenCalledWith(expect.stringContaining('Warning: Environment variable TEST_VAR is not set, but has a default value.'));
    expect(mockConsoleWarn).not.toHaveBeenCalledWith(expect.stringContaining('Default value:'));
  });

  it('should not show default values when showDefaultValues is not provided', () => {
    (envVariableChecker.processFiles as jest.Mock).mockReturnValue({
      errors: [],
      warnings: ['Warning: Environment variable TEST_VAR is not set, but has a default value.'],
      errorCount: 0
    });

    gardisto({ projectPath: testDir });

    expect(mockConsoleWarn).toHaveBeenCalledWith('Warnings for environment variables:');
    expect(mockConsoleWarn).toHaveBeenCalledWith(expect.stringContaining('Warning: Environment variable TEST_VAR is not set, but has a default value.'));
    expect(mockConsoleWarn).not.toHaveBeenCalledWith(expect.stringContaining('Default value:'));
  });

  it('should log errors and exit when errors are present', () => {
    (envVariableChecker.processFiles as jest.Mock).mockReturnValue({
      errors: ['Error: Environment variable REQUIRED_VAR is not set.'],
      warnings: [],
      errorCount: 1
    });

    gardisto({ projectPath: testDir });

    expect(mockConsoleError).toHaveBeenCalledWith('Errors found in environment variables:');
    expect(mockConsoleError).toHaveBeenCalledWith('Error: Environment variable REQUIRED_VAR is not set.');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should use provided options', () => {
    const options: GardistoOptions = {
      debug: true,
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts'],
      projectPath: testDir
    };

    gardisto(options);

    expect(fileUtils.getAllJSAndTSFiles).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Function),
      options.include,
      options.exclude
    );
  });

  it('should use default project path when not provided', () => {
    gardisto();

    expect(fileUtils.getAllJSAndTSFiles).toHaveBeenCalledWith(
      expect.stringContaining(process.cwd()),
      expect.any(Function),
      [],
      []
    );
  });
});