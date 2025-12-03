# Playwright Test Suite - Test Explanations

## Overview
This document explains each category of tests in the Playwright test suite for validating environment links from the `environmentsResponse.json` file.

---

## Test Category 1: Link Data Validation Tests

### Test Description
These tests verify that all required parameters within each link object are properly populated with valid data. They ensure data integrity before attempting to test URL accessibility.

### Steps
1. Load the environment's `links` array from the JSON response
2. Iterate through each link object in the array
3. For each link, validate:
   - `title` field exists and contains a non-empty value
   - `url` field exists and contains a non-empty value
   - `icon` field exists and contains a non-empty value
4. Check that none of these fields contain only whitespace characters (e.g., "   ")
5. Log the validation result for each link

### Expected Behavior
✅ **PASS**: 
- All link parameters (title, url, icon) are present
- All parameters contain actual text values (not empty strings or null)
- No parameters contain only whitespace
- Console output shows: `✓ Link {index} validation passed - Title: "{title}", Icon: "{icon}"`

❌ **FAIL**: 
- Any required parameter is missing or null
- Any parameter is an empty string or contains only whitespace
- Test throws an assertion error indicating which field failed validation

### Example Test Cases
- `Environment: alalcomenia-prod > Link Data Validation - All parameters are populated`
- `Environment: algos-dev > Link Data Validation - All parameters are populated`
- `Environment: am-okta-production > Link Data Validation - All parameters are populated`

### Why This Test Matters
- Ensures data consistency in the JSON file
- Prevents null pointer exceptions when processing links
- Validates that all required fields are properly configured
- Catches data entry errors early in the testing process

---

## Test Category 2: Individual Link HTTP Status Tests

### Test Description
These tests verify that each URL in the links array is accessible and returns a valid HTTP response (not a dead link). They simulate real-world user access to each link.

### Steps
1. Extract the URL string from the link object
2. Validate that the URL follows proper format (valid HTTP/HTTPS URL structure)
3. Check if the URL should be skipped based on ignore patterns:
   - Skip `javascript:*` URLs (JavaScript event handlers, not web links)
   - Skip `mailto:*` URLs (email links)
   - Skip `tel:*` URLs (phone links)
   - Skip `#*` URLs (page fragments/anchors)
4. If not skipped, proceed to test the link:
   - Use Playwright's `page.goto()` to navigate to the URL
   - Set timeout to 10 seconds per link
   - Wait for `domcontentloaded` event before checking response
   - Capture the HTTP response status code
5. Verify the status code is less than 400 (indicating success, not error)
6. Log the result with URL and status code

### Expected Behavior
✅ **PASS**: 
- URL format is valid (can be parsed as HTTP/HTTPS URL)
- HTTP response status is between 200-399 (success or redirect)
- Page loads within 10-second timeout
- Console output shows: `✓ {env-name} - {title}: {url} (Status: {status-code})`
- Example status codes: 200 (OK), 301 (Moved Permanently), 302 (Found), 307 (Temporary Redirect)

❌ **FAIL**: 
- URL format is invalid or malformed
- HTTP response status is 400 or greater (client/server error)
  - 400: Bad Request
  - 401: Unauthorized
  - 403: Forbidden
  - 404: Not Found
  - 500: Internal Server Error
  - 503: Service Unavailable
- Request times out after 10 seconds
- Network error: connection refused, host unreachable, DNS resolution failed
- Console output shows: 
  ```
  ✗ {env-name} - {title}: {url}
  Error: {detailed error message}
  ```

### Example Test Cases
- `Environment: alalcomenia-prod > Link 1: AWS Console (aws)`
  - URL: `https://orga.awsapps.com/start/#/console?account_id=026372558662`
  - Expected: Status 200-399 (accessible AWS console link)

- `Environment: algos-dev > Link 5: Grafana (grafana)`
  - Tests Grafana monitoring dashboard
  - Expected: Status 200-399 (accessible dashboard)

- `Environment: am-okta-production > Link 6: Kiali (kiali)`
  - Tests Kiali service mesh visualization
  - Expected: Status 200-399 (accessible service mesh UI)

### URL Patterns and Link Types Tested
| Link Type | Icon | Example | Action |
|-----------|------|---------|--------|
| AWS Console | aws | AWS management dashboard | Navigate & check status |
| Grafana Dashboard | grafana | Monitoring & metrics | Navigate & check status |
| Datadog APM | datadog | Application monitoring | Navigate & check status |
| Prometheus | prometheus | Metrics collection | Navigate & check status |
| Vault | vault | Secrets management | Navigate & check status |
| Consul | consul | Service discovery | Navigate & check status |
| Kiali | kiali | Service mesh UI | Navigate & check status |
| Alert Manager | alert-manager | Alert routing | Navigate & check status |
| Finout | finout | Cost optimization | Navigate & check status |
| GitLab | gitlab | Source code repository | Navigate & check status |

### Why This Test Matters
- Identifies broken/dead links before they impact users
- Verifies that all documented services are accessible
- Detects when services are down or misconfigured
- Ensures URLs point to correct destinations
- Validates authentication requirements or redirects

---

## Test Category 3: Summary Report Test

### Test Description
This test aggregates statistical information about all tested environments and links, providing an overview of test scope and coverage.

### Steps
1. Count the total number of environments in the test sample
2. Count how many environments have links (not empty)
3. Count the total number of links across all environments
4. Create a breakdown showing link count for each environment
5. Output summary statistics to console in a formatted table

### Expected Behavior
✅ **PASS**: 
- Summary report generates without errors
- Console displays formatted table with:
  - Total environments count
  - Count of environments with links
  - Total links across all environments
  - Per-environment breakdown
- Example output:
  ```
  === LINK SUMMARY REPORT ===
  Total Environments: 10
  Environments with Links: 10
  Total Links to Check: 71
  
  Breakdown by Environment:
    alalcomenia-prod: 3 link(s)
    alalcomenia-staging: 3 link(s)
    algos-dev: 8 link(s)
    alloresto-production: 8 link(s)
    am-okta-production: 9 link(s)
    ap-northeast-1-pdv-staging-1: 8 link(s)
    ap-northeast-1-pmt-staging-1: 8 link(s)
    ap-northeast-1-tgw-prod: 7 link(s)
    ap-southeast-2-ing-prod-1: 8 link(s)
    ap-southeast-2-ing-qa-1: 8 link(s)
  ===========================
  ```

❌ **FAIL**: 
- Report fails to generate due to data processing error
- Statistics are incorrect or missing
- Console output is malformed or incomplete

### Why This Test Matters
- Provides visibility into test coverage
- Helps identify if any environments are being skipped
- Gives quick overview of link count per environment
- Useful for reporting and documentation
- Helps detect configuration changes in data

---

## Overall Test Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Load environmentsResponse.json (first 10 environments)       │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ For Each Environment:                                        │
├─────────────────────────────────────────────────────────────┤
│ 1. Check if environment has links                           │
│    - If NO: Skip environment                                 │
│    - If YES: Continue to tests                              │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ TEST 1: Data Validation                                      │
├─────────────────────────────────────────────────────────────┤
│ For each link in environment:                               │
│  - Verify title exists & not empty                          │
│  - Verify url exists & not empty                            │
│  - Verify icon exists & not empty                           │
│ Result: PASS or FAIL                                        │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ TEST 2: HTTP Status Check (per link)                        │
├─────────────────────────────────────────────────────────────┤
│ For each link in environment:                               │
│  - Validate URL format                                      │
│  - Check skip patterns (javascript:, mailto:, etc.)         │
│  - Navigate to URL (10 sec timeout)                         │
│  - Capture HTTP status                                      │
│  - Verify status < 400                                      │
│ Result: PASS or FAIL per link                              │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ TEST 3: Summary Report                                       │
├─────────────────────────────────────────────────────────────┤
│ Generate aggregated statistics:                             │
│  - Count total environments                                 │
│  - Count environments with links                            │
│  - Count total links                                        │
│  - Breakdown per environment                                │
│ Result: PASS                                                │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ Generate Test Report (HTML, JSON, JUnit)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Test Configuration & Timeouts

### Timeout Settings
- **Per-Link HTTP Timeout**: 10 seconds
  - Time allowed for a single URL to load and return a response
  - If exceeded, test fails with timeout error
  
- **Test Timeout**: 15 seconds
  - Overall time limit for a single test case
  - Includes navigation + response capture

- **Browser Startup Timeout**: 30 seconds (default)
  - Time for browser to start and become ready

### Parallel Execution
- **Local Environment**: 4 parallel workers
  - Tests run simultaneously on 4 cores for faster execution
  
- **CI Environment**: 1 parallel worker
  - Tests run sequentially to avoid resource conflicts

### Browser Coverage
Tests run on three different browsers to ensure compatibility:
1. **Chromium** (Desktop Chrome equivalent)
2. **Firefox** (Desktop Firefox equivalent)
3. **WebKit** (Desktop Safari equivalent)

This means each test case runs 3 times (once per browser) unless skipped.

---

## Common Failure Scenarios

### Data Validation Failures
| Error | Cause | Solution |
|-------|-------|----------|
| `expect(link.title).toBeTruthy()` fails | Title is missing or empty | Update JSON: add non-empty title |
| `expect(link.url.trim()).not.toBe('')` fails | URL is only whitespace | Update JSON: remove whitespace |
| `expect(link.icon).toBeTruthy()` fails | Icon is null or empty | Update JSON: add valid icon name |

### HTTP Status Failures
| Error | Cause | Solution |
|-------|-------|----------|
| `expect(response?.status()).toBeLessThan(400)` fails with 404 | Link is dead/removed | Update URL or document as obsolete |
| `expect(response?.status()).toBeLessThan(400)` fails with 401/403 | Authentication required | Document that URL requires auth |
| Timeout error after 10 seconds | Service is slow/unreachable | Check if service is running or firewall blocked |
| `net::ERR_NAME_NOT_RESOLVED` | DNS lookup failed | Verify domain name is correct |
| `net::ERR_CONNECTION_REFUSED` | Service not running | Ensure service is deployed and running |

---

## Test Execution Command

```bash
# Run all tests
npm test

# Run with UI mode (interactive)
npm run test:ui

# Run with visible browsers
npm run test:headed

# Debug mode
npm run test:debug

# View HTML report
npm run test:report
```

---

## Test Artifacts Generated

After test execution, the following files are created:

1. **playwright-report/index.html** - Interactive HTML report with screenshots/videos
2. **test-results.json** - Machine-readable test results
3. **junit-results.xml** - JUnit format for CI/CD integration
4. **Console logs** - Real-time output during test execution

---

## Summary

This test suite provides comprehensive validation of environment link data through three complementary test categories:

1. **Data Validation** - Ensures JSON data quality
2. **HTTP Status Checks** - Verifies link accessibility
3. **Summary Report** - Provides test coverage overview

Together, these tests help maintain accurate, up-to-date, and accessible documentation of environment links across multiple services and regions.
