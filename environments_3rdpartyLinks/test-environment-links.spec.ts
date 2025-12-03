import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

interface LinkObject {
  title: string;
  url: string;
  icon: string;
}

interface Environment {
  name: string;
  links?: LinkObject[];
}

// Load the environments response JSON
const environmentsFilePath = path.join(__dirname, 'environmentsResponse.json');
const allEnvironmentsData: Environment[] = JSON.parse(
  fs.readFileSync(environmentsFilePath, 'utf-8')
);
// Sample 10 environments for testing
const environmentsData: Environment[] = allEnvironmentsData.slice(0, 10);

// Test configuration
const TIMEOUT = 10000; // 10 seconds timeout per link
const IGNORE_PATTERNS = [
  /^javascript:/i,
  /^mailto:/i,
  /^tel:/i,
  /^#/,
];

function shouldIgnoreUrl(url: string): boolean {
  return IGNORE_PATTERNS.some(pattern => pattern.test(url));
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Generate tests for each environment and its links
environmentsData.forEach((environment) => {
  if (!environment.links || environment.links.length === 0) {
    test.skip(`${environment.name} - No links to test`, async () => {
      // This environment has no links
    });
    return;
  }

  test.describe(`Environment: ${environment.name}`, () => {
    test(`Link Data Validation - All parameters are populated`, () => {
      environment.links!.forEach((link, index) => {
        // Validate that all required fields exist and are not empty
        expect(link.title).toBeTruthy();
        expect(link.url).toBeTruthy();
        expect(link.icon).toBeTruthy();

        // Additional validation: no whitespace-only strings
        expect(link.title.trim()).not.toBe('');
        expect(link.url.trim()).not.toBe('');
        expect(link.icon.trim()).not.toBe('');

        // Log validation result
        console.log(
          `✓ Link ${index + 1} validation passed - Title: "${link.title}", Icon: "${link.icon}"`
        );
      });
    });

    environment.links.forEach((link, index) => {
      test(`Link ${index + 1}: ${link.title} (${link.icon})`, async ({ page }) => {
        // Skip if URL matches ignore patterns
        if (shouldIgnoreUrl(link.url)) {
          test.skip();
          return;
        }

        // Validate URL format
        expect(isValidUrl(link.url)).toBeTruthy();

        let response;
        try {
          // Attempt to navigate to the URL
          response = await page.goto(link.url, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });

          // Check for successful response status (2xx or 3xx)
          expect(response?.status()).toBeLessThan(400);

          // Log successful link
          console.log(`✓ ${environment.name} - ${link.title}: ${link.url} (Status: ${response?.status()})`);
        } catch (error) {
          // Capture detailed error information
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`✗ ${environment.name} - ${link.title}: ${link.url}`);
          console.error(`  Error: ${errorMessage}`);
          throw new Error(
            `Dead link detected in ${environment.name}: ${link.title}\n` +
            `URL: ${link.url}\n` +
            `Error: ${errorMessage}`
          );
        }
      });
    });
  });
});

// Summary test that collects link statistics
test('Link Summary Report', async () => {
  let totalLinks = 0;
  let environmentsWithLinks = 0;
  const report: Record<string, number> = {};

  environmentsData.forEach((environment) => {
    if (environment.links && environment.links.length > 0) {
      totalLinks += environment.links.length;
      environmentsWithLinks += 1;
      report[environment.name] = environment.links.length;
    }
  });

  console.log('\n=== LINK SUMMARY REPORT ===');
  console.log(`Total Environments: ${environmentsData.length}`);
  console.log(`Environments with Links: ${environmentsWithLinks}`);
  console.log(`Total Links to Check: ${totalLinks}`);
  console.log('\nBreakdown by Environment:');
  Object.entries(report).forEach(([env, count]) => {
    console.log(`  ${env}: ${count} link(s)`);
  });
  console.log('===========================\n');

  expect(totalLinks).toBeGreaterThan(0);
});
