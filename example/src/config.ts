/**
 * Example configuration with validation for Gardisto
 * This file demonstrates best practices for environment variable handling:
 * - Strong type validation
 * - Secure default values
 * - Comprehensive error messages
 * - Runtime validation
 */

/** 
 * Validates a URL string and ensures it's properly formatted
 * @param url - The URL to validate
 * @param name - Name of the environment variable for error messages
 * @throws {Error} If URL is missing or invalid
 * @returns {string} The validated URL
 */
function validateUrl(url: string | undefined, name: string): string {
  if (!url) {
    throw new Error(`${name} is required`);
  }
  try {
    new URL(url);
    return url;
  } catch {
    throw new Error(`${name} must be a valid URL`);
  }
}

/**
 * Validates and parses a port number
 * @param port - The port number string from environment
 * @param defaultPort - Default port to use if none provided
 * @throws {Error} If port is not a valid number in range 1-65535
 * @returns {number} The validated port number
 */
function validatePort(port: string | undefined, defaultPort: number): number {
  if (!port) return defaultPort;
  const parsedPort = Number.parseInt(port, 10);
  if (isNaN(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
    throw new Error('Port must be a number between 1 and 65535');
  }
  return parsedPort;
}

/**
 * Validates an API key with optional default value
 * @param key - The API key from environment
 * @param defaultKey - Optional default key (not recommended for production)
 * @throws {Error} If no key provided and no default
 * @returns {string} The validated API key
 */
function validateApiKey(key: string | undefined, defaultKey?: string): string {
  if (!key && !defaultKey) {
    throw new Error('API key is required');
  }
  if (!key && defaultKey) {
    console.warn('Warning: Using default API key. This is not recommended in production.');
    return defaultKey;
  }
  return key!;
}

/** Environment Variables */
export const databaseUrl = validateUrl(process.env.DATABASE_URL, 'DATABASE_URL');
export const apiKey = validateApiKey(process.env.API_KEY, "default-key");
export const port = validatePort(process.env.PORT, 3000);
export const debugMode = process.env.DEBUG_MODE === "true";
export const token = validateApiKey(process.env.TOKEN);

/** Configuration Type */
export type Config = {
  databaseUrl: string;
  apiKey: string;
  port: number;
  debugMode: boolean;
  token: string;
};

/** Export configuration object */
export const config: Config = {
  databaseUrl,
  apiKey,
  port,
  debugMode,
  token
};
