import { checkEnvVariables } from 'env-sentinel';
import { startApp } from './app';

console.log('Running env-sentinel check...');

// Run the env-sentinel check
checkEnvVariables({ debug: false });

// Start the application
startApp();