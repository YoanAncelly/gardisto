export interface GardistoOptions {
  debug?: boolean;
  include?: string[];
  exclude?: string[];
  showDefaultValues?: boolean;
  projectPath?: string;
}

export type Logger = (...args: unknown[]) => void;