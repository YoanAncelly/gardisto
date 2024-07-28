export interface GardistoOptions {
  debug?: boolean;
  include?: string[];
  exclude?: string[];
}

export type Logger = (...args: unknown[]) => void;
