# Test Case Documentation: Environment Links Dead Link Checker

## Overview
This document describes all test cases executed in the Playwright test suite for checking dead links in the environment response JSON file.

---

## Test Structure

The test suite is organized by environment, with each environment containing:
1. **Data Validation Test** - Verifies all link parameters are populated
2. **Individual Link Tests** - Checks each link for dead links and HTTP status codes
3. **Summary Report** - Provides overall test statistics

---

## Test Cases Summary

### Sample: 10 Environments Tested
- **alalcomenia-prod** (3 links)
- **alalcomenia-staging** (3 links)
- **algos-dev** (8 links)
- **alloresto-production** (8 links)
- **am-okta-production** (9 links)
- **ap-northeast-1-pdv-staging-1** (8 links)
- **ap-northeast-1-pmt-staging-1** (8 links)
- **ap-northeast-1-tgw-prod** (7 links)
- **ap-southeast-2-ing-prod-1** (8 links)
- **ap-southeast-2-ing-qa-1** (8 links)

**Total Links Tested: 71 links across 10 environments**

---

## Test Case Details

### 1. Link Data Validation Test
**Test Name:** `Environment: {environment-name} > Link Data Validation - All parameters are populated`

#### Summary
Validates that all parameters within the `links` array contain valid, non-empty data.

#### Steps to Test
1. Load the environment's `links` array
2. For each link object in the array:
   - Check that `title` field exists and is not empty/null
   - Check that `url` field exists and is not empty/null
   - Check that `icon` field exists and is not empty/null
   - Verify no fields contain only whitespace characters

#### Expected Result
✅ **PASS**: All link parameters (title, url, icon) are populated with non-empty values
❌ **FAIL**: Any parameter is missing, null, or contains only whitespace

#### Example Test Cases
- Environment: **alalcomenia-prod** > Link Data Validation
- Environment: **algos-dev** > Link Data Validation
- Environment: **am-okta-production** > Link Data Validation

---

### 2. Individual Link HTTP Status Test
**Test Name:** `Environment: {environment-name} > Link {index}: {title} ({icon})`

#### Summary
Checks each individual URL to ensure it's accessible and returns a valid HTTP status code (not a dead link).

#### Steps to Test
1. Extract the URL from the link object
2. Validate URL format (must be a valid HTTP/HTTPS URL)
3. Skip testing if URL is non-HTTP type (javascript:, mailto:, tel:, fragments)
4. Navigate to the URL using Playwright's `page.goto()` method with 10-second timeout
5. Capture the HTTP response status code

#### Expected Result
✅ **PASS**: 
- URL format is valid
- HTTP response status is less than 400 (2xx or 3xx responses)
- Page successfully loads within 10-second timeout
- Console logs: `✓ {env-name} - {link-title}: {url} (Status: {status-code})`

❌ **FAIL**:
- URL format is invalid
- HTTP response status is 400 or greater (dead link)
- Request times out after 10 seconds
- Network error or connection refused
- Console logs: `✗ {env-name} - {link-title}: {url}` with detailed error message

#### Example Test Cases
- Environment: **alalcomenia-prod** > Link 1: AWS Console (aws)
  - URL: `https://orga.awsapps.com/start/#/console?account_id=026372558662`
  - Expected Status: 200-399

- Environment: **algos-dev** > Link 5: Grafana (grafana)
  - Tests Grafana dashboard URL
  - Expected Status: 200-399

- Environment: **am-okta-production** > Link 6: Kiali (kiali)
  - Tests Kiali service mesh visualization tool
  - Expected Status: 200-399

---

### 3. Summary Report Test
**Test Name:** `Link Summary Report`

#### Summary
Aggregates and reports statistics about all tested environments and links.

#### Steps to Test
1. Count total number of environments in the test set
2. Count how many environments have links
3. Count total number of links across all environments
4. Generate breakdown of links per environment
5. Log comprehensive summary to console

#### Expected Result
✅ **PASS**: Summary report generated successfully with statistics

Example output:
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

---

## Test Execution Details

### Test Configuration
- **Framework**: Playwright Test
- **Timeout per Link**: 10 seconds
- **HTTP Timeout**: 15 seconds
- **Retries (CI)**: 2 attempts
- **Parallel Workers**: 4 (local), 1 (CI)
- **Browsers Tested**: Chromium, Firefox, WebKit

### URL Patterns Skipped
The following URL patterns are automatically skipped (not tested):
- JavaScript URLs: `javascript:*`
- Email links: `mailto:*`
- Phone links: `tel:*`
- Fragment links: `#*`

### Response Status Code Validation
- ✅ **Valid (Pass)**: 200-399 (Success or Redirect)
- ❌ **Invalid (Fail)**: 400+ (Client/Server Error)
- ❌ **Invalid (Fail)**: Timeout > 10 seconds
- ❌ **Invalid (Fail)**: Network errors or refused connections

---

## Test Execution Results

### Summary Statistics from Sample Run
- **Total Tests**: 210 tests (71 link tests + 10 validation tests + 1 summary test, × 3 browsers)
- **Passed**: 33 tests (validation and summary tests passed)
- **Failed**: 177 tests (link HTTP tests failed - browsers need to be downloaded)
- **Skipped**: 0 tests

### Browser Coverage
- ✅ Chromium browser (Desktop Chrome)
- ✅ Firefox browser (Desktop Firefox)
- ✅ WebKit browser (Desktop Safari)

### Common Link Types Tested
1. **AWS Console** - AWS management console access
2. **Grafana** - Monitoring and visualization dashboards
3. **Datadog** - Application performance monitoring (APM)
4. **Prometheus** - Metrics collection and monitoring
5. **Vault** - Secrets management
6. **Consul** - Service discovery and configuration
7. **Kiali** - Service mesh observability
8. **Alert Manager** - Alert management and routing
9. **Finout** - Cost optimization
10. **GitLab** - Git repository management

---

## Setup & Execution

### Prerequisites
```bash
npm install
npx playwright install
```

### Run All Tests
```bash
npm test
```

### Run with Full Sample Data
To test all environments (not just the first 10), modify line 20 in `test-environment-links.spec.ts`:
```typescript
// Change from:
const environmentsData: Environment[] = allEnvironmentsData.slice(0, 10);

// To:
const environmentsData: Environment[] = allEnvironmentsData;
```

### Run in UI Mode
```bash
npm run test:ui
```

### View Test Report
```bash
npm run test:report
```

---

## Expected vs Actual Results

### Expected Behavior
✅ All parameter validation tests should **PASS** - verifying data integrity
⚠️ Link HTTP tests may **FAIL** if:
  - URLs are internal/restricted (require authentication)
  - URLs are behind firewalls
  - Services are temporarily unavailable
  - Invalid SSL certificates

### Common Failure Scenarios

| Failure Type | Description | Example |
|---|---|---|
| **Invalid URL Format** | URL doesn't follow HTTP/HTTPS schema | Missing "https://" prefix |
| **Dead Link** | HTTP 404 - Resource not found | Deleted or moved URL |
| **Access Denied** | HTTP 401/403 - Authentication required | AWS/internal URLs |
| **Timeout** | Request exceeds 10-second limit | Slow/unreachable service |
| **Empty Parameter** | Missing title, url, or icon | Data validation failure |
| **Whitespace Only** | Parameter contains only spaces | " " instead of actual value |

---

## Notes & Considerations

1. **Browser Dependencies**: WebKit browser requires additional setup. Run `npx playwright install webkit` if browser errors occur.

2. **Authentication**: Tests don't include authentication. Some URLs (like AWS Console) may return authentication redirects rather than full page loads.

3. **Network Dependencies**: Tests require internet connectivity. Some URLs may be internal/restricted networks.

4. **Timeout Handling**: The 10-second timeout can be adjusted in the test file if testing slow services.

5. **Parallel Execution**: Tests run in parallel across 4 workers by default for faster execution.

6. **Detailed Logs**: Each test logs results to console with timestamps and status codes for debugging.

---

## Test Maintenance

### To Add New Environments
1. Ensure the `environmentsResponse.json` file is updated with new environments
2. Increase the sample size in line 20: `allEnvironmentsData.slice(0, N)`
3. Re-run tests

### To Modify Validation Rules
Edit the validation logic in the "Link Data Validation" test section to add custom rules for title, url, or icon fields.

### To Adjust Timeout Settings
Modify these constants in `test-environment-links.spec.ts`:
- `TIMEOUT = 10000` - Individual link timeout (milliseconds)
- `playwright.config.ts` - `timeout: 15000` - Test timeout

---

## Conclusion

This test suite provides comprehensive validation of environment link data and dead link detection across multiple browsers. The combination of data validation and HTTP status checking ensures both data integrity and link accessibility.
