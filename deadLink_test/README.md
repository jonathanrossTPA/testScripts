# Documentation Dead Link Checker

This tool checks all documentation links from the `allDocs.json` file to identify dead or broken links.

## Overview

The dead link checker reads the `allDocs.json` file, extracts all `relativePath` values, constructs full URLs using the base path `https://sonic.staging.jet-internal.com/docs/`, and tests each URL to verify it's accessible.

## Files

- `deadlink-checker.js` - Main dead link checking script
- `test-deadlink-checker.js` - Test script for running partial checks and demonstrations
- `allDocs.json` - Source JSON file containing document metadata
- `README.md` - This file

## Usage

### Full Dead Link Check

Run the complete dead link check on all URLs:

```bash
node deadlink-checker.js
```

This will:
- Load all documents from `allDocs.json`
- Test each URL for accessibility
- Display real-time progress
- Generate a comprehensive report
- Save failed URLs to `dead-links-report.txt`
- Exit with code 1 if dead links are found

### Test Mode

Run a smaller test to verify the checker is working:

```bash
node test-deadlink-checker.js
```

This will:
- Show document statistics
- Test a single URL
- Test the first 5 URLs from the JSON file

### Using npm scripts

If you create a `package.json` file, you can also run:

```bash
npm run check
```

## Features

### Real-time Progress
- Shows progress counter `[current/total]`
- Displays each URL being tested
- Shows immediate success/failure status

### Comprehensive Reporting
- Total URLs checked
- Success/failure counts
- Detailed list of dead links with error messages
- Status code distribution
- Failed URLs saved to text file

### Error Handling
- 10-second timeout per request
- Graceful handling of network errors
- HTTP status code analysis
- Colored console output for better readability

### Performance Optimizations
- Uses HEAD requests instead of GET (faster, less bandwidth)
- Sequential checking to avoid overwhelming the server
- Proper error handling and timeouts

## Output

### Successful Run Example
```
Dead Link Checker for Documentation
====================================
Base URL: https://sonic.staging.jet-internal.com/docs/
JSON File: c:\Users\JonathanRoss\allDocs.json

Loaded 1388 documents from JSON file.
Generated 1388 URLs to check.

Starting to check 1388 URLs...

[1/1388] Checking: https://sonic.staging.jet-internal.com/docs/component/restaurantmenumanagernotifications/index.html... ✓ OK (200)
[2/1388] Checking: https://sonic.staging.jet-internal.com/docs/component/restauranteventsdb/index.html... ✓ OK (200)
...

=== DEAD LINK CHECK REPORT ===
Total URLs checked: 1388
Successful: 1388
Failed: 0

🎉 All links are working!

Status Code Distribution:
  200: 1388
```

### Failed Links Example
```
=== DEAD LINK CHECK REPORT ===
Total URLs checked: 1388
Successful: 1385
Failed: 3

DEAD LINKS FOUND:
==================
1. https://sonic.staging.jet-internal.com/docs/component/broken-link/index.html
   Error: HTTP 404

2. https://sonic.staging.jet-internal.com/docs/component/timeout-link/index.html
   Error: Request timeout

3. https://sonic.staging.jet-internal.com/docs/component/error-link/index.html
   Error: ENOTFOUND

Dead links have been saved to 'dead-links-report.txt'

Status Code Distribution:
  200: 1385
  404: 2
  Error: 1
```

## Requirements

- Node.js 12.0.0 or higher
- `allDocs.json` file in the same directory
- Network access to `sonic.staging.jet-internal.com`

## Error Codes

The script exits with:
- `0` - All links are working
- `1` - Dead links found or script error

## Customization

You can modify the following constants in `deadlink-checker.js`:

```javascript
const BASE_URL = 'https://sonic.staging.jet-internal.com/docs/';
const JSON_FILE_PATH = path.join(__dirname, 'allDocs.json');
```

To change the timeout or request options, modify the `checkUrl` function:

```javascript
const options = {
  // ... existing options
  timeout: 10000, // Change timeout (milliseconds)
};
```

## Troubleshooting

1. **File not found error**: Ensure `allDocs.json` is in the same directory
2. **Network timeouts**: The server might be slow; timeouts are set to 10 seconds
3. **Too many requests**: The script runs sequentially to avoid overwhelming the server
4. **Authentication errors**: Some URLs might require authentication

## Integration

This script can be integrated into:
- CI/CD pipelines
- Automated testing suites
- Documentation maintenance workflows
- Monitoring systems