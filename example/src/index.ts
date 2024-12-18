import { gardisto } from "gardisto";
import { startApp } from "./app";

console.log("Running gardisto check...");

// Run the gardisto check
gardisto({
  debug: true,
  include: ["**/*.ts"],
  exclude: ["node_modules/**", "dist/**", "tests/**"],
  showDefaultValues: true
});

// If gardisto doesn't exit the process, it means no errors were found
console.log("No environment variable issues found. Starting the application.");
startApp();