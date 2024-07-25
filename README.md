# env-sentinel

Automatically check and verify environment variables in a TypeScript project.

## Installation

```bash
npm install env-sentinel
```

## Usage

To use the `env-sentinel` package, simply require it in your project and call the `checkEnvVariables` function, passing the root directory of your project as an argument.

```javascript
const { checkEnvVariables } = require('env-sentinel');

checkEnvVariables('./path/to/project/root');
```

The `checkEnvVariables` function will recursively traverse all TypeScript files in the specified directory and its subdirectories, checking for any references to `process.env` variables. If a variable is not set, it will throw an error with the file name and line number where the variable is referenced. If a variable is set but empty, it will log a warning with the file name and line number. Additionally, if a variable is used with an OR operator (`||`), it will log a warning suggesting that the variable might not be set.

## Example

```bash
const { checkEnvVariables } = require('env-sentinel');

checkEnvVariables('./path/to/project/root');

// Output:
// Error: Environment variable DB_HOST is not set.
// File: ./src/db.ts
// Line: 10
// Warning: Environment variable API_KEY is empty.
// File: ./src/api.ts
// Line: 20
// Warning: Environment variable DB_USER has an OR operator. It might not be set.
// File: ./src/db.ts
// Line: 15
```

## License

`env-sentinel` is licensed under the MIT License.