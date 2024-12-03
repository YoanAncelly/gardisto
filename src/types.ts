/** Options for configuring Gardisto's behavior */
export interface GardistoOptions {
  /** Enable debug mode for verbose logging */
  debug?: boolean;
  /** Glob patterns to include specific files/directories */
  include?: string[];
  /** Glob patterns to exclude specific files/directories */
  exclude?: string[];
  /** Show default values in environment variable warnings */
  showDefaultValues?: boolean;
  /** Root path of the project to analyze */
  projectPath?: string;
}

/** Result of checking a single environment variable */
export interface EnvCheckResult {
  /** Name of the environment variable */
  variable: string;
  /** Whether the environment variable exists and has a non-empty value */
  exists: boolean;
  /** Current value of the environment variable (if it exists) */
  value?: string;
  /** Location where the environment variable is referenced */
  location: CodeLocation;
  /** Default value specified in code (if any) */
  defaultValue?: string;
}

/** Location information for code references */
export interface CodeLocation {
  /** Absolute path to the file */
  filePath: string;
  /** Line number (1-based) */
  line: number;
  /** Column number (1-based) */
  column: number;
}

/** Results from processing all files */
export interface ProcessingResult {
  /** List of errors found during processing */
  errors: EnvError[];
  /** List of warnings found during processing */
  warnings: EnvWarning[];
  /** Total number of errors found */
  errorCount: number;
  /** Set of environment variables that have been checked */
  checkedVariables: Set<string>;
}

/** Base error class for Gardisto-specific errors */
export class GardistoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GardistoError';
    // Restore prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Error class for environment variable issues */
export class EnvError extends GardistoError {
  constructor(
    /** Name of the environment variable */
    public readonly variable: string,
    /** Location where the error occurred */
    public readonly location: CodeLocation,
    message: string
  ) {
    super(message);
    this.name = 'EnvError';
    // Restore prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Warning class for environment variable issues */
export class EnvWarning extends GardistoError {
  constructor(
    /** Name of the environment variable */
    public readonly variable: string,
    /** Location where the warning occurred */
    public readonly location: CodeLocation,
    message: string
  ) {
    super(message);
    this.name = 'EnvWarning';
    // Restore prototype chain
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Required configuration after resolving optional values */
export interface GardistoConfig extends Required<Omit<GardistoOptions, 'debug' | 'showDefaultValues'>> {
  /** Root path of the project to analyze */
  projectPath: string;
  /** Glob patterns to include specific files/directories */
  include: string[];
  /** Glob patterns to exclude specific files/directories */
  exclude: string[];
}

/** Available log levels */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Logger function type */
export type Logger = (level: LogLevel, ...args: unknown[]) => void;

/** Type guard for checking if a value is a GardistoError */
export function isGardistoError(error: unknown): error is GardistoError {
  return error instanceof GardistoError;
}

/** Type guard for checking if a value is an EnvError */
export function isEnvError(error: unknown): error is EnvError {
  return error instanceof EnvError;
}

/** Type guard for checking if a value is an EnvWarning */
export function isEnvWarning(error: unknown): error is EnvWarning {
  return error instanceof EnvWarning;
}