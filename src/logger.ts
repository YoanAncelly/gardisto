import { Logger } from './types';

export const createLogger = (debug: boolean): Logger => (...args: unknown[]): void => {
  if (debug) {
    console.log("[DEBUG]", ...args, "\n");
  }
};
