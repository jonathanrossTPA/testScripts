# Environment Links Dead Link Checker

Playwright tests to check for dead links in the `environmentsResponse.json` file.

## Overview

This test suite automatically generates tests for each environment and its associated links. It:
- Validates URL format
- Checks HTTP response status codes
- Reports dead links and errors
- Skips non-HTTP URLs (JavaScript, mailto, tel, etc.)
- Generates detailed test reports

## Setup

### Prerequisites
- Node.js 16+ installed
- npm installed

### Installation

```bash
npm install
```

This will install Playwright and its dependencies.

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in UI mode (interactive)
```bash
npm run test:ui
```

### Run tests with browser visible
```bash
npm run test:headed
```

### Debug tests
```bash
npm run test:debug
```

### View test report
```bash
npm run test:report
```

## Test Structure

The test suite generates:

1. **Individual Tests per Link**: Each environment and link combination gets its own test
   - Test name: `Environment: {env-name} > Link {index}: {link-title} ({icon})`
   - Validates URL format
   - Sends HTTP request with 10-second timeout
   - Checks for 2xx or 3xx status codes

2. **Summary Test**: Provides overall statistics
   - Total environments
   - Environments with links
   - Total links to check
   - Breakdown by environment

## Configuration

Edit `playwright.config.ts` to customize:

- **Timeout**: Change `timeout` value (default: 15 seconds)
- **Retries**: Adjust `retries` for CI environments
- **Workers**: Control parallel test execution with `workers`
- **Browsers**: Enable/disable Chrome, Firefox, Safari testing
- **Screenshots/Video**: Configure failure recording

## Reports

After running tests, the following reports are generated:

- **HTML Report**: `playwright-report/index.html`
- **JSON Report**: `test-results.json`
- **JUnit Report**: `junit-results.xml`

View the HTML report:
```bash
npm run test:report
```

## Environment Files

- `environmentsResponse.json`: The source data containing all environments and links to test

## Notes

- Tests automatically skip environments with no links
- Non-HTTP URLs (JavaScript, mailto, tel, fragments) are skipped
- Tests run in parallel by default for faster execution
- Failed links will cause the test to fail with detailed error messages
- Each browser (Chromium, Firefox, WebKit) runs the full test suite by default

## Customization

To exclude certain URLs or patterns, modify the `IGNORE_PATTERNS` array in `test-environment-links.spec.ts`:

```typescript
const IGNORE_PATTERNS = [
  /^javascript:/i,
  /^mailto:/i,
  /^tel:/i,
  /^#/,
];
```

## Troubleshooting

### Tests timing out
- Increase `TIMEOUT` in `test-environment-links.spec.ts`
- Increase `timeout` in `playwright.config.ts`

### Too many parallel tests
- Reduce `workers` in `playwright.config.ts`

### Need more detailed logs
- Run with `npm run test:debug` for step-by-step execution
- Check the generated HTML report for screenshots/videos
