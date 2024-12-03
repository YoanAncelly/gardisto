# Gardisto

<div align="center">

<h1>Gardisto</h1>
<p>A TypeScript utility to automatically check and verify environment variables in your project</p>

<p align="center">
    <a href="https://www.npmjs.com/package/gardisto">
        <img alt="NPM Version" src="https://img.shields.io/npm/v/gardisto.svg?style=for-the-badge&logo=npm&color=0470FF&logoColor=white">
    </a>
    <a href="https://www.npmjs.com/package/gardisto">
        <img alt="NPM Downloads" src="https://img.shields.io/npm/dt/gardisto?style=for-the-badge&color=67ACF3">
    </a>
    <a href="https://www.npmjs.com/package/gardisto">
        <img alt="Bundle Size" src="https://img.shields.io/bundlephobia/minzip/gardisto?style=for-the-badge&color=F9DBBC">
    </a>
</p>

</div>

## ℹ️ About the Project

Gardisto (from Esperanto, meaning "Guardian") is a TypeScript utility that helps you prevent environment variable related issues before they happen in production. It automatically scans your codebase for environment variable usage and verifies their existence and values, helping you catch configuration issues early in development.

## ⭐️ Features

1. **Automatic Environment Variable Detection**
   - Recursively scans TypeScript files for `process.env` usage
   - Identifies missing or empty environment variables
   - Detects potentially unsafe fallback patterns

2. **Flexible Configuration**
   - Customizable include/exclude patterns
   - Debug mode for detailed scanning information
   - Support for TypeScript and JavaScript files

3. **Developer-Friendly Outputs**
   - Clear error messages with file and line references
   - Warning system for potential issues
   - Detailed logging in debug mode

## 🛠 Stack Tech

- [![TypeScript][TypeScript-badge]][TypeScript-url] - Built with TypeScript for type safety
- [![Node.js][Node.js-badge]][Node.js-url] - Powered by Node.js runtime
- [![Jest][Jest-badge]][Jest-url] - Tested with Jest

[TypeScript-badge]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[Node.js-badge]: https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white
[Node.js-url]: https://nodejs.org/
[Jest-badge]: https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white
[Jest-url]: https://jestjs.io/

## 📖 API Reference

### `gardisto(options?: GardistoOptions)`

Main function to check environment variables in your project.

#### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `debug` | `boolean` | `false` | Enable debug logging for detailed information |
| `include` | `string[]` | `[]` | Glob patterns for files to include |
| `exclude` | `string[]` | `[]` | Glob patterns for files to exclude |
| `showDefaultValues` | `boolean` | `false` | Show default values in warnings |
| `projectPath` | `string` | `process.cwd()` | Root path of the project to analyze |

#### Example with All Options

```typescript
import { gardisto } from 'gardisto';

gardisto({
  // Enable debug mode for verbose logging
  debug: true,
  
  // Only check files in src and config directories
  include: ['src/**/*.ts', 'config/**/*.ts'],
  
  // Exclude test files and generated code
  exclude: [
    '**/*.test.ts',
    '**/*.spec.ts',
    '**/dist/**',
    '**/node_modules/**'
  ],
  
  // Show default values in warnings
  showDefaultValues: true,
  
  // Custom project path
  projectPath: './my-project'
});
```

### Error Handling

Gardisto provides detailed error messages with file locations:

```typescript
// Missing required environment variable
Error: Missing required environment variable: API_KEY
at src/config.ts:10:15

// Warning for default value usage
Warning: Environment variable DATABASE_URL uses a default value: "localhost:5432"
at src/database.ts:5:20
```

### Advanced Usage

#### Custom Logger Configuration

```typescript
import { createLogger } from 'gardisto';

const logger = createLogger({
  debug: true,
  minLevel: 'info',
  maxLength: 5000,
  colorize: true
});

// Use the logger
logger('info', 'Starting environment check...');
logger('error', new Error('Failed to read .env file'));
```

#### Programmatic Usage

```typescript
import { gardisto } from 'gardisto';

async function validateEnvironment() {
  try {
    const result = gardisto({
      debug: true,
      include: ['src/**/*.ts']
    });

    // Handle results
    if (result.errors.length > 0) {
      console.error('Environment validation failed!');
      process.exit(1);
    }
  } catch (error) {
    console.error('Failed to validate environment:', error);
    process.exit(1);
  }
}
```

### Best Practices

1. **CI/CD Integration**
   ```yaml
   # GitHub Actions example
   jobs:
     validate-env:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - uses: actions/setup-node@v2
         - run: npm install gardisto
         - run: npx gardisto
   ```

2. **Pre-commit Hook**
   ```json
   {
     "husky": {
       "hooks": {
         "pre-commit": "gardisto"
       }
     }
   }
   ```

3. **Environment Variable Patterns**
   ```typescript
   // Good - Easy to detect
   const apiKey = process.env.API_KEY;
   
   // Good - Default value is visible
   const port = process.env.PORT || '3000';
   
   // Avoid - Hard to detect
   const config = {
     key: process[['env']]['API_KEY']
   };
   ```

### Common Issues and Solutions

#### Missing Environment Variables

Problem:
```
Error: Missing required environment variable: API_KEY
```

Solution:
1. Add the variable to your `.env` file
2. Set the variable in your environment
3. Or add a default value if appropriate

#### Default Value Warnings

Warning:
```
Warning: Environment variable PORT uses a default value: "3000"
```

Solutions:
1. Set the variable explicitly if needed
2. Ignore if the default is acceptable
3. Document the default in your README

#### Type Safety

For better type safety, use type assertions:

```typescript
const port = process.env.PORT || '3000';
const numericPort = parseInt(port, 10);

if (isNaN(numericPort)) {
  throw new Error('PORT must be a valid number');
}
```

## ⚙️ Setup

### Installation

```bash
npm install gardisto
```

### Usage

Basic usage with TypeScript:

```typescript
import { gardisto } from 'gardisto';

// Basic usage
gardisto({
  debug: false,
  exclude: ['dist', 'node_modules']
});

// Advanced usage with custom patterns
gardisto({
  debug: process.env.DEBUG === 'true',
  include: ['src'],
  exclude: ['dist', 'node_modules', '**/*.test.ts'],
}, './path/to/project/root');
```

## 🚀 Running the Example

To try out Gardisto with the provided example project, follow these steps:

1. **Build and Link the Package**
   ```bash
   # Build the package
   npm run build

   # Create a global link
   npm link
   ```

2. **Set Up the Example Project**
   ```bash
   # Navigate to the example directory
   cd example

   # Link to the local gardisto package
   npm link gardisto
   ```

3. **Run the Example**
   
   The example project includes three test scenarios:

   ```bash
   # Run with all environment variables set
   npm run test:complete

   # Run with some missing environment variables
   npm run test:partial

   # Run with no environment variables
   npm run test:missing
   ```

   The test scripts demonstrate how Gardisto behaves with:
   - Complete environment configuration (`test:complete`)
   - Partial environment configuration (`test:partial`)
   - Missing environment variables (`test:missing`)

4. **Expected Output**
   
   When running `test:complete`, you should see:
   - Environment variable checks
   - Debug logs (if enabled)
   - Warnings for any variables using default values
   - Success message if all required variables are present

## 🏆 Acknowledgements

- Built with TypeScript
- Powered by Node.js file system APIs
- Uses AST parsing for accurate detection

## 👏🏻 Contributing

We welcome contributions! Here's how you can help:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📖 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

Need help? Found a bug? Have a feature request?

- 📫 Open an [issue](https://github.com/yoanancelly/gardisto/issues)
- 💬 Start a [discussion](https://github.com/yoanancelly/gardisto/discussions)
- ⭐ Star the project if you find it useful!

<p align="right"><a href="#readme-top">Back to top ⬆️</a></p>
