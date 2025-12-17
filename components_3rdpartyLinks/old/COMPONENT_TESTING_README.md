# Component Third-Party Links Extractor & Tester

This project automatically extracts third-party links from component pages and tests them for dead or bad links using Playwright.

## Workflow Overview

```
1. Extract Component Links
   └─→ Read component_links.txt
   └─→ Fetch each component page
   └─→ Parse HTML for third-party links
   └─→ Save to component_with_third_party_links.json

2. Test Links with Playwright
   └─→ Load extracted third-party links
   └─→ Test component page accessibility
   └─→ Test each third-party link for HTTP status
   └─→ Generate report
```

## Setup

### Prerequisites
- Node.js 16+ installed
- npm installed

### Installation

```bash
npm install
npx playwright install
```

## Usage

### Step 1: Extract Third-Party Links

This script fetches each component page and extracts all third-party links found on the page.

```bash
npm run extract-links
```

**What it does:**
- Reads `component_links.txt` (3,491 component URLs)
- Fetches each component page from `https://sonic.staging.jet-internal.com/components/{name}`
- Parses HTML to find links to external services (GitHub, GitLab, Datadog, etc.)
- Saves results to `component_with_third_party_links.json`
- Processes in batches of 5 to avoid overwhelming the server
- Skips internal/local links (jet-internal.com, takeaway.com, localhost)

**Output file structure:**
```json
[
  {
    "componentName": "offermanagementofferstore",
    "componentUrl": "https://sonic.staging.jet-internal.com/components/offermanagementofferstore",
    "thirdPartyLinks": [
      "https://github.com/example/repo",
      "https://app.datadoghq.eu/apm/...",
      "https://www.pagerduty.com/schedules..."
    ]
  },
  ...
]
```

### Step 2: Run Playwright Tests

Once you have the extracted links, run the test suite to check each link for dead or bad links.

```bash
npm test
```

**Tests included:**
1. **Component Page Accessibility** - Tests that each component page is accessible (HTTP < 400)
2. **Third-Party Links Validation** - Tests that all extracted links are valid URLs
3. **Dead Link Detection** - Tests each third-party link for accessibility and HTTP status
4. **Summary Report** - Aggregates statistics about all tested links

### Step 3: View Test Reports

```bash
npm run test:report
```

This opens an interactive HTML report with:
- Test results and pass/fail status
- Screenshots of failed tests
- Video recordings of failed tests
- Detailed error messages

## Test Modes

```bash
# Run all tests
npm test

# Run with UI mode (interactive browser)
npm run test:ui

# Run with visible browsers
npm run test:headed

# Debug mode (step through tests)
npm run test:debug
```

## Configuration

### Link Extraction Settings

Edit `extract-component-links.ts` to customize:

**Third-party patterns** (what counts as external):
```typescript
const THIRD_PARTY_PATTERNS = [
  /github\.com/i,
  /gitlab\.com/i,
  /datadoghq\.com/i,
  /pagerduty\.com/i,
  // Add more patterns...
];
```

**Internal domains to skip**:
```typescript
if (hostname.includes('jet-internal.com') || 
    hostname.includes('takeaway.com') ||
    // Add more internal domains...
```

**Batch size** (how many components to process in parallel):
```typescript
const BATCH_SIZE = 5;
```

### Test Settings

Edit `test-component-third-party-links.spec.ts` to customize:

**Timeout per link** (in milliseconds):
```typescript
const TIMEOUT = 10000; // 10 seconds
```

**Sample size** (how many components to test):
```typescript
componentsData.slice(0, 50)  // Tests first 50 components
```

**URL patterns to skip**:
```typescript
const IGNORE_PATTERNS = [
  /^javascript:/i,
  /^mailto:/i,
  /^tel:/i,
  /^#/,
  /^data:/i,
];
```

## Output Files

### During Extraction

- **component_with_third_party_links.json** - Main output with all extracted links
- Console logs showing progress and any errors

### After Testing

- **playwright-report/index.html** - Interactive test report
- **test-results.json** - Machine-readable results
- **junit-results.xml** - JUnit format for CI/CD integration

## Common Issues & Solutions

### Issue: "Failed to fetch component page"
**Cause:** Component page doesn't exist or is unreachable  
**Solution:** Verify the component name is correct and the page URL is accessible

### Issue: Timeout errors during extraction
**Cause:** Network is slow or server is overloaded  
**Solution:** Increase batch delay in `extract-component-links.ts` or reduce `BATCH_SIZE`

### Issue: "jq: command not found" errors
**Cause:** jq utility is not installed  
**Solution:** Use PowerShell scripts instead (already using them)

### Issue: Playwright browser not found
**Cause:** Browsers weren't installed  
**Solution:** Run `npx playwright install` to download browsers

## Performance Considerations

- **Extraction time:** ~5-10 minutes for 3,491 components (depends on network speed)
- **Test time:** ~2-5 hours for all links (depends on number of third-party links found)
- **Parallel workers:** 4 (local), 1 (CI/CD)

## Example Results

After running extraction and tests on a sample:

```
=== THIRD-PARTY LINKS SUMMARY REPORT ===
Components Tested: 50
Components with Third-Party Links: 48
Total Third-Party Links Found: 156
Average Links per Component: 3.25

Top Components by Link Count:
  component-a: 12 link(s)
  component-b: 10 link(s)
  component-c: 8 link(s)
  ...
=========================================
```

## Playwright Browser Coverage

Tests run on three browsers:
- **Chromium** (Desktop Chrome)
- **Firefox** (Desktop Firefox)
- **WebKit** (Desktop Safari)

## Best Practices

1. **Run extraction first** - Always extract links before testing
2. **Test in phases** - Start with a small sample to verify setup works
3. **Monitor network** - Extraction makes many HTTP requests; monitor bandwidth
4. **Schedule regularly** - Run tests periodically to catch broken links early
5. **Review reports** - Check failed tests immediately to identify patterns

## Advanced Usage

### Test only specific components

Edit `test-component-third-party-links.spec.ts` and change:
```typescript
componentsData.slice(0, 50)  // Change 50 to desired count
```

### Extract only specific patterns

Edit `extract-component-links.ts` and modify `THIRD_PARTY_PATTERNS` array

### Re-use extracted data

The `component_with_third_party_links.json` file persists, so you can:
1. Run extraction once
2. Run tests multiple times without re-extracting

## Support & Documentation

- [Playwright Documentation](https://playwright.dev/)
- [JSDOM Documentation](https://github.com/jsdom/jsdom)
- [Axios Documentation](https://axios-http.com/)

## Notes

- Some third-party links may require authentication (AWS, PagerDuty, etc.)
- Authentication-required links may show as 401/403 errors (not necessarily broken)
- Some links may be temporarily down; run tests multiple times for accurate results
- Consider adding retry logic for flaky external services
