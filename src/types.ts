export interface GardistoOptions {
  debug?: boolean;
  include?: string[];
  exclude?: string[];
  showDefaultValues?: boolean;
}

export type Logger = (...args: unknown[]) => void;
