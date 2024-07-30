import { GardistoOptions } from './types';
import { gardisto as runGardisto } from './gardisto';

export const gardisto = (options: GardistoOptions = {}): void => {
  runGardisto(options);
};

export * from './types';