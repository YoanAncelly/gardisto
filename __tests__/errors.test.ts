import {
  GardistoError,
  ConfigurationError,
  FileSystemError,
  EnvironmentError,
  ValidationError,
} from '../src/errors';

describe('GardistoError', () => {
  // Test base error class construction
  test('should create base error with correct properties', () => {
    // Arrange
    const message = 'Test error message';
    const code = 'TEST_ERROR';
    const context = { key: 'value' };

    // Act
    const error = new GardistoError(message, code, context);

    // Assert
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(GardistoError);
    expect(error.message).toBe(message);
    expect(error.code).toBe(code);
    expect(error.context).toEqual(context);
    expect(error.name).toBe('GardistoError');
  });

  test('should convert to JSON with all properties', () => {
    // Arrange
    const error = new GardistoError('Test message', 'TEST_CODE', { data: 'test' });

    // Act
    const json = error.toJSON();

    // Assert
    expect(json).toEqual({
      name: 'GardistoError',
      message: 'Test message',
      code: 'TEST_CODE',
      context: { data: 'test' },
      stack: error.stack,
    });
  });
});

describe('Specific Error Classes', () => {
  test('ConfigurationError should have correct properties', () => {
    // Arrange & Act
    const error = new ConfigurationError('Config error', { config: 'invalid' });

    // Assert
    expect(error).toBeInstanceOf(GardistoError);
    expect(error).toBeInstanceOf(ConfigurationError);
    expect(error.name).toBe('ConfigurationError');
    expect(error.code).toBe('CONFIG_ERROR');
    expect(error.message).toBe('Config error');
    expect(error.context).toEqual({ config: 'invalid' });
  });

  test('FileSystemError should have correct properties', () => {
    // Arrange & Act
    const error = new FileSystemError('File error', { path: '/test' });

    // Assert
    expect(error).toBeInstanceOf(GardistoError);
    expect(error).toBeInstanceOf(FileSystemError);
    expect(error.name).toBe('FileSystemError');
    expect(error.code).toBe('FILESYSTEM_ERROR');
    expect(error.message).toBe('File error');
    expect(error.context).toEqual({ path: '/test' });
  });

  test('EnvironmentError should have correct properties', () => {
    // Arrange & Act
    const error = new EnvironmentError('Env error', { var: 'NODE_ENV' });

    // Assert
    expect(error).toBeInstanceOf(GardistoError);
    expect(error).toBeInstanceOf(EnvironmentError);
    expect(error.name).toBe('EnvironmentError');
    expect(error.code).toBe('ENV_ERROR');
    expect(error.message).toBe('Env error');
    expect(error.context).toEqual({ var: 'NODE_ENV' });
  });

  test('ValidationError should have correct properties', () => {
    // Arrange & Act
    const error = new ValidationError('Validation error', { field: 'username' });

    // Assert
    expect(error).toBeInstanceOf(GardistoError);
    expect(error).toBeInstanceOf(ValidationError);
    expect(error.name).toBe('ValidationError');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('Validation error');
    expect(error.context).toEqual({ field: 'username' });
  });
});
