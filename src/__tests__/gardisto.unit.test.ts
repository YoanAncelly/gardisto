import { handleResults } from '../gardisto';

describe('handleResults', () => {
  const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
  const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should log success message when no errors or warnings', () => {
    handleResults([], [], 0);
    expect(mockConsoleLog).toHaveBeenCalledWith('No environment variable issues found.');
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should log warnings when present', () => {
    const warnings = ['Warning 1', 'Warning 2'];
    handleResults([], warnings, 0);
    expect(mockConsoleWarn).toHaveBeenCalledWith('Warnings for environment variables:');
    expect(mockConsoleWarn).toHaveBeenCalledWith('Warning 1');
    expect(mockConsoleWarn).toHaveBeenCalledWith('Warning 2');
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should log errors and exit when errors are present', () => {
    const errors = ['Error 1', 'Error 2'];
    handleResults(errors, [], 2);
    expect(mockConsoleError).toHaveBeenCalledWith('Errors found in environment variables:');
    expect(mockConsoleError).toHaveBeenCalledWith('Error 1');
    expect(mockConsoleError).toHaveBeenCalledWith('Error 2');
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});