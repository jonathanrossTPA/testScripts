# Component Third-Party Links Scanner

A Playwright-based test suite that scans Sonic component pages for third-party links and generates comprehensive dead link reports.

## Overview

This project automates the detection and validation of third-party links across Sonic component pages. It processes thousands of component URLs in parallel batches, extracts external links, and checks their availability, generating detailed CSV reports for analysis.

## Features

- **Batch Processing**: Processes URLs in configurable batches (default: 10 URLs per batch)
- **Parallel Execution**: Uses Playwright's parallelization for efficient processing
- **Shadow DOM Support**: Extracts links from within Shadow DOM elements
- **Comprehensive Link Detection**: Finds all external links on component pages
- **Dead Link Detection**: Validates link availability with HTTP status checking
- **CSV Report Generation**: Creates detailed reports with source URLs, links, and status
- **Error Handling**: Graceful handling of page load failures and network errors

## Architecture

### Test Structure
- **350 individual tests** (for ~3,500 URLs processed in batches of 10)
- **Parallel execution** across multiple workers
- **10-minute global timeout** for large-scale processing
- **Per-page timeouts** (30s navigation, 8s link checking)

### Data Flow
1. **Input**: `component_links.txt` - List of component URLs (one per line)
2. **Processing**: Each batch test loads pages and extracts third-party links
3. **Validation**: HTTP requests check link availability
4. **Output**: `external-link-report.csv` - Comprehensive link status report

## Files

### Input Files
- `component_links.txt` - Source URLs to scan (one URL per line)

### Output Files
- `external-link-report.csv` - Generated report with link analysis

### Configuration Files
- `playwright.config.js` - Playwright configuration with extended timeouts
- `package.json` - Dependencies and scripts

### Test Files
- `third-party-links-report-batched.spec.js` - Main test suite

## Prerequisites

- Node.js (v16+ recommended)
- npm or yarn
- Playwright browsers installed

## Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Install Playwright browsers**:
   ```bash
   npx playwright install
   ```

## Usage

### Run All Tests
```bash
npm test
# or
npx playwright test
```

### Run Specific Test Patterns
```bash
# Run only the first batch
npx playwright test --grep "Batch 1/350"

# Run first 5 batches
npx playwright test --grep "Batch [1-5]/350"

# Debug mode (headed browser)
npm run test:debug
```

### View Test Results
```bash
npx playwright show-report
```

## Configuration

### Batch Size
Modify the batch size in `third-party-links-report-batched.spec.js`:
```javascript
const batches = chunk(urls, 10); // Change 10 to desired batch size
```

### Timeouts
Adjust timeouts in `playwright.config.js`:
```javascript
timeout: 600000,        // Global test timeout (10 minutes)
navigationTimeout: 60000, // Page navigation timeout (1 minute)
actionTimeout: 30000,    // Action timeout (30 seconds)
```

### Browser Selection
Enable additional browsers in `playwright.config.js`:
```javascript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  // Uncomment to enable:
  // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
]
```

## Output Format

### CSV Report Structure
```csv
source_url,third_party_link,status
"https://sonic.staging.jet-internal.com/components/example","https://external-site.com/link","OK"
"https://sonic.staging.jet-internal.com/components/example","https://broken-link.com","DEAD_404"
"https://sonic.staging.jet-internal.com/components/example","https://timeout-link.com","DEAD_NETWORK_ERROR"
"https://sonic.staging.jet-internal.com/components/nolinks","","NO_LINKS_FOUND"
```

### Status Codes
- `OK` - Link is accessible (2xx status)
- `DEAD_{status}` - Link returned error status (e.g., `DEAD_404`, `DEAD_403`)
- `DEAD_NETWORK_ERROR` - Network timeout or connection failure
- `NO_LINKS_FOUND` - Page contains no third-party links
- `PAGE_LOAD_ERROR` - Failed to load the source page

## How It Works

### Link Extraction Process
1. **Page Loading**: Navigate to each component URL with `waitUntil: 'networkidle'`
2. **DOM Traversal**: Use `document.createTreeWalker` to find all `<a>` elements
3. **Shadow DOM Support**: Recursively search within Shadow DOM roots
4. **Origin Filtering**: Extract only links from different origins (third-party)

### Link Validation
1. **HTTP Requests**: Send GET requests to each extracted link
2. **Status Checking**: Verify response status codes
3. **Timeout Handling**: 8-second timeout per link check
4. **Error Classification**: Categorize failures appropriately

### Batch Processing
- **Parallel Tests**: Each batch runs as an independent Playwright test
- **Worker Distribution**: Playwright automatically distributes tests across workers
- **Progress Tracking**: Console output shows batch progress
- **Fault Isolation**: Batch failures don't affect other batches

## Performance Considerations

### Current Configuration
- **3,491 URLs** → **350 batches** of 10 URLs each
- **~18 seconds** per batch (varies by page complexity)
- **Total runtime**: ~1.75 hours for full scan
- **Parallel workers**: Configurable (default: auto)

### Optimization Tips
- **Reduce batch size** for faster feedback during development
- **Increase workers** for faster execution on powerful machines
- **Filter URLs** to focus on specific components
- **Adjust timeouts** based on network conditions

## Troubleshooting

### Common Issues

#### "No tests found" Error
- **Cause**: Module system conflicts or syntax errors
- **Solution**: Ensure ES6 imports are compatible with your Node.js version

#### Timeout Errors
- **Cause**: Pages taking too long to load or network issues
- **Solution**: Increase timeouts in `playwright.config.js`

#### Memory Issues
- **Cause**: Processing too many URLs simultaneously
- **Solution**: Reduce batch size or worker count

#### CSV File Locked
- **Cause**: Another process has the CSV file open
- **Solution**: Close Excel/other programs accessing the CSV

### Debug Mode
Run tests in headed mode for visual debugging:
```bash
npx playwright test --headed --debug
```

### Partial Runs
Test individual batches to isolate issues:
```bash
npx playwright test --grep "Batch 1/350"
```

## Development

### Adding New Tests
Create additional test files following the same pattern:
```javascript
import { test } from '@playwright/test';
// ... test logic
```

### Modifying Link Extraction
Update the `extractThirdPartyLinks` function to customize link detection logic.

### Custom Reporting
Modify CSV output format or add additional reporting formats.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Run full test suite
5. Submit pull request

## License

ISC License - See package.json for details.