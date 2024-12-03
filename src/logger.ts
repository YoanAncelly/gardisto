import { Logger, LogLevel } from './types';

export const createLogger = (debug: boolean): Logger => {
  const logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  const getTimestamp = (): string => {
    return new Date().toISOString();
  };

  const formatMessage = (level: LogLevel, ...args: unknown[]): string => {
    const timestamp = getTimestamp();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    return `${prefix} ${args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ')}`;
  };

  return (level: LogLevel, ...args: unknown[]): void => {
    // Only log debug messages if debug mode is enabled
    if (level === 'debug' && !debug) {
      return;
    }

    const message = formatMessage(level, ...args);
    
    switch (level) {
      case 'error':
        console.error(message);
        break;
      case 'warn':
        console.warn(message);
        break;
      case 'debug':
      case 'info':
      default:
        console.log(message);
        break;
    }
  };
};
