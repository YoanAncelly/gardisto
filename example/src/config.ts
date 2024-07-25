export const databaseUrl = process.env.DATABASE_URL;
export const apiKey = process.env.API_KEY || 'default-key';
export const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
export const debugMode = process.env.DEBUG_MODE === 'true';