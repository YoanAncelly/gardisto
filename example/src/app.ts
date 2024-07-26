import { apiKey, databaseUrl, debugMode, port, token } from "./config";

function startApp() {
	console.log("Starting application...");
	console.log("Database URL:", databaseUrl);
	console.log("API Key:", apiKey);
	console.log("Port:", port);
	console.log("Token:", token);

	if (debugMode) {
		console.log("Debug mode is enabled");
	}
}

export { startApp };
