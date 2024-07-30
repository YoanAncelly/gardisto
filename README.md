# gardisto

Automatically check and verify environment variables in your project.

## Installation

```bash
npm install gardisto
```

## Usage

To use the `gardisto` package, simply require it in your project and call the `checkEnvVariables` function, passing the root directory of your project as an argument.

```typescript
import { checkEnvVariables } from 'gardisto';

checkEnvVariables({ debug: false }, './path/to/project/root');
```

The `gardisto` function will recursively traverse all TypeScript files in the specified directory and its subdirectories, checking for any references to `process.env` variables. If a variable is not set, it will log an error with the file name and line number where the variable is referenced. If a variable is set but empty, it will log a warning with the file name and line number. Additionally, if a variable is used with an OR operator (`||` or `??`), it will log a warning suggesting that the variable might not be set.

You can also specify include and exclude patterns to filter the files that are checked for environment variables. For example:

```typescript
import { gardisto } from 'gardisto';

gardisto({
  debug: process.env.DEBUG === "true",
  include: ["src"],
  exclude: ["dist", "node_modules"],
}, './path/to/project/root');
```

This will only check files with the `.ts` or `.tsx` extension in the `src` directory and its subdirectories, excluding any files with the `.test.ts` or `.spec.tsx` extension.

## Example

```bash
import { gardisto } from "gardisto";

gardisto({
  debug: process.env.DEBUG === "true",
  exclude: ["dist", "node_modules"],
});

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

`gardisto` is licensed under the MIT License.
