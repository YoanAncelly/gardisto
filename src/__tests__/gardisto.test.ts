import { gardisto } from '../gardisto';
import * as fileUtils from '../fileUtils';
import * as envVariableChecker from '../envVariableChecker';
import { GardistoOptions } from '../types';

jest.mock('../fileUtils');
jest.mock('../envVariableChecker');

describe('gardisto', () => {
  const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
    return undefined as unknown as never;
  });
  const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
  const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
    (fileUtils.getAllJSAndTSFiles as jest.Mock).mockReturnValue(['file1.ts', 'file2.ts']);
  });

  const runGardisto = (options: GardistoOptions = {}) => {
    const mockedFileUtils = fileUtils as jest.Mocked<typeof fileUtils>;
    mockedFileUtils.getAllJSAndTSFiles.mockReturnValue(['file1.ts', 'file2.ts']);

    const mockedEnvVariableChecker = envVariableChecker as jest.Mocked<typeof envVariableChecker>;
    mockedEnvVariableChecker.processFiles.mockReturnValue({ errors: [], warnings: [], errorCount: 0 });

    gardisto(options);
  };

  it('should run without errors when no issues are found', () => {
    runGardisto();

    expect(mockConsoleLog).toHaveBeenCalledWith('No environment variable issues found.');
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should use provided options', () => {
    const options: GardistoOptions = {
      debug: true,
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts'],
      projectPath: '/custom/path'
    };

    runGardisto(options);

    expect(fileUtils.getAllJSAndTSFiles).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Function),
      options.include,
      options.exclude
    );
  });

  it('should log warnings when warnings are present', () => {
    (envVariableChecker.processFiles as jest.Mock).mockReturnValue({
      errors: [],
      warnings: ['Warning 1', 'Warning 2'],
      errorCount: 0
    });

    gardisto();

    expect(mockConsoleWarn).toHaveBeenCalledWith('Warnings for environment variables:');
    expect(mockConsoleWarn).toHaveBeenCalledWith('Warning 1');
    expect(mockConsoleWarn).toHaveBeenCalledWith('Warning 2');
  });

  it('should log errors and exit when errors are present', () => {
    (envVariableChecker.processFiles as jest.Mock).mockReturnValue({
      errors: ['Error 1', 'Error 2'],
      warnings: [],
      errorCount: 2
    });

    gardisto();

    expect(mockConsoleError).toHaveBeenCalledWith('Errors found in environment variables:');
    expect(mockConsoleError).toHaveBeenCalledWith('Error 1');
    expect(mockConsoleError).toHaveBeenCalledWith('Error 2');
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it('should use default project path when not provided', () => {
    const mockedFileUtils = fileUtils as jest.Mocked<typeof fileUtils>;
    runGardisto();

    expect(mockedFileUtils.getAllJSAndTSFiles).toHaveBeenCalledWith(
      expect.stringContaining(process.cwd()),
      expect.any(Function),
      [],
      []
    );
  });
});