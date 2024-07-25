import { databaseUrl, apiKey, port, debugMode } from './config';

function startApp() {
  console.log('Starting application...');
  console.log('Database URL:', databaseUrl);
  console.log('API Key:', apiKey);
  console.log('Port:', port);

  if (debugMode) {
    console.log('Debug mode is enabled');
  }

  // Simulating usage of an environment variable that might not be set
  const logLevel = process.env.LOG_LEVEL || 'info';
  console.log('Log level:', logLevel);
}

export { startApp };