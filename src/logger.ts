import { Logger, LogLevel, isGardistoError } from './types';

/** Configuration options for the logger */
interface LoggerOptions {
  /** Enable debug mode */
  debug: boolean;
  /** Minimum log level to display */
  minLevel?: LogLevel;
  /** Maximum length for log messages */
  maxLength?: number;
  /** Whether to colorize output */
  colorize?: boolean;
}

const LOG_COLORS = {
  debug: '\x1b[36m', // cyan
  info: '\x1b[32m',  // green
  warn: '\x1b[33m',  // yellow
  error: '\x1b[31m', // red
  reset: '\x1b[0m'
} as const;

/** Creates a configured logger instance */
export const createLogger = (options: LoggerOptions | boolean): Logger => {
  // Handle legacy boolean parameter
  const config: LoggerOptions = typeof options === 'boolean' ? { debug: options } : options;
  const {
    debug = false,
    minLevel = debug ? 'debug' : 'info',
    maxLength = 10000,
    colorize = true
  } = config;

  const logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  /** Get current timestamp in ISO format */
  const getTimestamp = (): string => {
    return new Date().toISOString();
  };

  /** Format a value for logging */
  const formatValue = (value: unknown): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (value instanceof Error) {
      const errorMessage = (value as Error).message || 'Unknown error';
      const errorName = (value as Error).name || 'Error';
      const errorStack = debug ? (value as Error).stack : undefined;

      return isGardistoError(value) || !debug
        ? `${errorName}: ${errorMessage}`
        : `${errorName}: ${errorMessage}${errorStack ? `\n${errorStack}` : ''}`;
    }
    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch (err) {
        return `[Circular or Invalid JSON: ${String(value)}]`;
      }
    }
    return String(value);
  };

  /** Format the complete log message */
  const formatMessage = (level: LogLevel, args: unknown[]): string => {
    const timestamp = getTimestamp();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    const message = args.map(formatValue).join(' ');
    
    // Truncate long messages
    const fullMessage = `${prefix} ${message}`;
    if (fullMessage.length > maxLength) {
      return `${fullMessage.slice(0, maxLength)}... (truncated)`;
    }
    return fullMessage;
  };

  /** Add color to the message if enabled */
  const colorizeMessage = (level: LogLevel, message: string): string => {
    if (!config.colorize) return message;
    return `${LOG_COLORS[level]}${message}${LOG_COLORS.reset}`;
  };

  return (level: LogLevel, ...args: unknown[]): void => {
    // Check minimum log level
    if (logLevels[level] < logLevels[minLevel]) {
      return;
    }

    try {
      const message = formatMessage(level, args);
      const colorizedMessage = colorizeMessage(level, message);
      
      switch (level) {
        case 'error':
          console.error(colorizedMessage);
          break;
        case 'warn':
          console.warn(colorizedMessage);
          break;
        case 'debug':
        case 'info':
        default:
          console.log(colorizedMessage);
          break;
      }
    } catch (error) {
      // Fallback logging in case of formatting errors
      console.error(`Failed to format log message: ${String(error)}`);
      console.error('Original arguments:', args);
    }
  };
};
