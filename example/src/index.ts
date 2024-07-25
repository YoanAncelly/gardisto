import { envSentinel } from 'env-sentinel';
import { startApp } from './app';

console.log('Running env-sentinel check...');

// Run the env-sentinel check
envSentinel({ debug: false });

// Start the application
startApp();