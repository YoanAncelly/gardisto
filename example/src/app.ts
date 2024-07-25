import { databaseUrl, apiKey, port, debugMode } from './config';

function startApp() {
  console.log('Starting application...');
  console.log('Database URL:', databaseUrl);
  console.log('API Key:', apiKey);
  console.log('Port:', port);

  if (debugMode) {
    console.log('Debug mode is enabled');
  }
}

export { startApp };