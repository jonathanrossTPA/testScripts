import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

interface ComponentLink {
  componentName: string;
  componentUrl: string;
  allLinks: string[];
}

// Load the extracted component links
const dataFilePath = path.join(__dirname, 'component_with_all_links.json');
let componentsData: ComponentLink[] = [];

if (fs.existsSync(dataFilePath)) {
  try {
    componentsData = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));
  } catch (error) {
    console.error('Failed to load component links data:', error);
  }
}

// Test configuration
const TIMEOUT = 10000; // 10 seconds timeout per link
const IGNORE_PATTERNS = [
  /^javascript:/i,
  /^mailto:/i,
  /^tel:/i,
  /^#/,
  /^data:/i,
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

// Test component accessibility first
test.describe('Component Pages - Accessibility', () => {
  componentsData.slice(0, 50).forEach((component) => {
    test(`Component Page: ${component.componentName}`, async ({ page }) => {
      try {
        const response = await page.goto(component.componentUrl, {
          waitUntil: 'domcontentloaded',
          timeout: TIMEOUT,
        });

        expect(response?.status()).toBeLessThan(400);
        console.log(`✓ Component page accessible: ${component.componentUrl} (Status: ${response?.status()})`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`✗ Failed to access component page: ${component.componentUrl}`);
        console.error(`  Error: ${errorMessage}`);
        throw error;
      }
    });
  });
});

// Test third-party links
test.describe('All Links - Dead Link Detection', () => {
  componentsData.slice(0, 50).forEach((component) => {
    if (component.allLinks.length === 0) {
      test.skip(`${component.componentName} - No links`, async () => {
        // No links to test
      });
      return;
    }

    test.describe(`Component: ${component.componentName}`, () => {
      test('Links Data Validation', () => {
        component.allLinks.forEach((link, index) => {
          expect(isValidUrl(link)).toBeTruthy();
          console.log(`✓ Link ${index + 1} is valid: ${link}`);
        });
      });

      component.allLinks.forEach((link, index) => {
        test(`Link ${index + 1}: ${link.substring(0, 80)}...`, async ({ page }) => {
          // Skip if URL matches ignore patterns
          if (shouldIgnoreUrl(link)) {
            test.skip();
            return;
          }

          try {
            const response = await page.goto(link, {
              waitUntil: 'domcontentloaded',
              timeout: TIMEOUT,
            });

            // Check for successful response status (2xx or 3xx)
            expect(response?.status()).toBeLessThan(400);

            console.log(`✓ ${component.componentName} - Link accessible: ${link} (Status: ${response?.status()})`);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`✗ ${component.componentName} - Dead link: ${link}`);
            console.error(`  Error: ${errorMessage}`);
            throw new Error(
              `Dead link in ${component.componentName}: ${link}\nError: ${errorMessage}`
            );
          }
        });
      });
    });
  });
});

// Summary report
test('Links Summary Report', async () => {
  let totalComponents = 0;
  let componentsWithLinks = 0;
  let totalLinks = 0;
  const report: Record<string, number> = {};

  componentsData.slice(0, 50).forEach((component) => {
    totalComponents++;
    if (component.allLinks.length > 0) {
      componentsWithLinks++;
      totalLinks += component.allLinks.length;
      report[component.componentName] = component.allLinks.length;
    }
  });

  console.log('\n=== LINKS SUMMARY REPORT ===');
  console.log(`Components Tested: ${totalComponents}`);
  console.log(`Components with Links: ${componentsWithLinks}`);
  console.log(`Total Links Found: ${totalLinks}`);
  console.log(`Average Links per Component: ${(totalLinks / componentsWithLinks).toFixed(2)}`);
  console.log('\nTop Components by Link Count:');
  
  Object.entries(report)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([component, count]) => {
      console.log(`  ${component}: ${count} link(s)`);
    });
  
  console.log('=============================\n');

  expect(totalLinks).toBeGreaterThan(0);
});
