/** Types for error handling */
import type { GardistoError, EnvironmentError, ConfigurationError, FileSystemError, ValidationError } from './errors';

/** Options for configuring Gardisto's behavior */
export interface GardistoOptions {
  /** Enable debug mode for verbose logging */
  debug?: boolean;
  /** List of file patterns to include */
  include?: string[];
  /** List of file patterns to exclude */
  exclude?: string[];
  /** Show default values in output */
  showDefaultValues?: boolean;
  /** Path to the project root */
  projectPath?: string;
}

/** Branded type for environment variable names */
type EnvVarName = string & { readonly brand: unique symbol; }

/** Helper function to create EnvVarName from string */
export function createEnvVarName(name: string): EnvVarName {
  return name as EnvVarName;
}

/** Result of checking a single environment variable */
export interface EnvCheckResult {
  /** Name of the environment variable */
  variable: EnvVarName;
  /** Whether the variable exists */
  exists: boolean;
  /** Current value of the variable */
  value?: string;
  /** Location where the variable is used */
  location: CodeLocation;
  /** Default value if one is specified */
  defaultValue?: string;
}

/** Location information for code references */
export interface CodeLocation {
  /** Path to the file */
  filePath: string;
  /** Line number (1-based) */
  line: number;
  /** Column number (1-based) */
  column: number;
}

/** Results from processing all files */
export interface ProcessingResult {
  /** Array of errors encountered during processing */
  errors: Array<EnvironmentError>;
  /** List of warnings found during processing */
  warnings: EnvWarning[];
  /** Total number of errors found */
  errorCount: number;
  /** Set of environment variables that were checked */
  checkedVariables: Set<EnvVarName>;
}

/** Warning class for environment variable issues */
export class EnvWarning {
  constructor(
    /** Name of the environment variable */
    public readonly variable: EnvVarName,
    /** Location where the warning occurred */
    public readonly location: CodeLocation,
    /** Warning message */
    public readonly message: string,
    debug: boolean = false
  ) {
    this.name = 'EnvWarning';
  }
  
  public readonly name: string;

  toString(): string {
    return `${this.name}: ${this.message} (${this.variable} at ${this.location.filePath}:${this.location.line}:${this.location.column})`;
  }
}

/** Required configuration after resolving optional values */
export interface GardistoConfig {
  /** Path to the project root */
  projectPath: string;
  /** List of file patterns to include */
  include: string[];
  /** List of file patterns to exclude */
  exclude: string[];
}

/** Available log levels */
export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug'
}

/** Logger function type */
export type Logger = (level: LogLevel, message: string) => void;

/** Type guard for checking if a value is a GardistoError */
export function isGardistoError(error: unknown): error is GardistoError {
  const { GardistoError } = require('./errors');
  return error instanceof GardistoError;
}

/** Type guard for checking if a value is an EnvWarning */
export function isEnvWarning(error: unknown): error is EnvWarning {
  return error instanceof EnvWarning;
}