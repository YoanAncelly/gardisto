import { createLogger } from '../logger';

describe('createLogger', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('should not log when debug is false', () => {
    const logger = createLogger(false);
    logger('Test message');
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it('should log when debug is true', () => {
    const logger = createLogger(true);
    logger('Test message');
    expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG]', 'Test message', '\n');
  });

  it('should handle multiple arguments', () => {
    const logger = createLogger(true);
    logger('Test', 123, { key: 'value' });
    expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG]', 'Test', 123, { key: 'value' }, '\n');
  });
});