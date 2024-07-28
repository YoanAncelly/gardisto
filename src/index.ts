import { GardistoOptions } from './types';
import { Gardisto } from './gardisto';

export const gardisto = (options: GardistoOptions = {}): void => {
  const checker = new Gardisto(options);
  checker.run();
};

export { Gardisto };
export * from './types';