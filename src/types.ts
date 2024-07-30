export interface GardistoOptions {
  debug?: boolean;
  include?: string[];
  exclude?: string[];
  projectPath?: string;
}

export type Logger = (...args: unknown[]) => void;