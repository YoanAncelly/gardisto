/**
 * Base custom error class for Gardisto project
 * Provides enhanced error tracking and context
 */
export class GardistoError extends Error {
  public readonly code: string;
  public readonly context?: Record<string, unknown>;

  constructor(
    message: string, 
    code: string, 
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'GardistoError';
    this.code = code;
    this.context = context;

    // Maintains proper stack trace for where the error was thrown
    Object.setPrototypeOf(this, GardistoError.prototype);
  }

  /**
   * Converts the error to a structured JSON for logging or API responses
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      stack: this.stack
    };
  }
}

/**
 * Error for configuration-related issues
 */
export class ConfigurationError extends GardistoError {
  constructor(
    message: string, 
    context?: Record<string, unknown>
  ) {
    super(message, 'CONFIG_ERROR', context);
    this.name = 'ConfigurationError';
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }
}

/**
 * Error for file system operations
 */
export class FileSystemError extends GardistoError {
  constructor(
    message: string, 
    context?: Record<string, unknown>
  ) {
    super(message, 'FILESYSTEM_ERROR', context);
    this.name = 'FileSystemError';
    Object.setPrototypeOf(this, FileSystemError.prototype);
  }
}

/**
 * Error for environment variable validation
 */
export class EnvironmentError extends GardistoError {
  constructor(
    message: string, 
    context?: Record<string, unknown>
  ) {
    super(message, 'ENV_ERROR', context);
    this.name = 'EnvironmentError';
    Object.setPrototypeOf(this, EnvironmentError.prototype);
  }
}

/**
 * Error for runtime validation errors
 */
export class ValidationError extends GardistoError {
  constructor(
    message: string, 
    context?: Record<string, unknown>
  ) {
    super(message, 'VALIDATION_ERROR', context);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
