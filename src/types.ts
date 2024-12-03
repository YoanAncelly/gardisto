export interface GardistoOptions {
  debug?: boolean;
  include?: string[];
  exclude?: string[];
  showDefaultValues?: boolean;
  projectPath?: string;
}

// Result types for environment variable checks
export interface EnvCheckResult {
  variable: string;
  exists: boolean;
  value?: string;
  location: CodeLocation;
  defaultValue?: string;
}

export interface CodeLocation {
  filePath: string;
  line: number;
  column: number;
}

export interface ProcessingResult {
  errors: EnvError[];
  warnings: EnvWarning[];
  errorCount: number;
  checkedVariables: Set<string>;
}

// Custom error types
export class GardistoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GardistoError';
  }
}

export class EnvError extends GardistoError {
  constructor(
    public readonly variable: string,
    public readonly location: CodeLocation,
    message: string
  ) {
    super(message);
    this.name = 'EnvError';
  }
}

export class EnvWarning extends GardistoError {
  constructor(
    public readonly variable: string,
    public readonly location: CodeLocation,
    message: string
  ) {
    super(message);
    this.name = 'EnvWarning';
  }
}

// Configuration types
export interface GardistoConfig extends GardistoOptions {
  projectPath: string; // Make projectPath required
  include: string[]; // Make include required
  exclude: string[]; // Make exclude required
}

// Logging types
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type Logger = (level: LogLevel, ...args: unknown[]) => void;