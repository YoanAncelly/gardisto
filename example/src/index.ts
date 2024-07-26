import { checkEnvVariables } from "gardisto";
import { startApp } from "./app";

console.log("Running gardisto check...");

// Run the gardisto check
checkEnvVariables({ debug: false });

// Start the application
startApp();
