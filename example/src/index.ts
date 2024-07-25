import { envSentinel } from 'env-sentinel';
import path from 'path';
import { startApp } from './app';

console.log('Running env-sentinel check...');

// Run the env-sentinel check
envSentinel(path.join(__dirname, '..'));

console.log('\nStarting application...\n');

// Start the application
startApp();