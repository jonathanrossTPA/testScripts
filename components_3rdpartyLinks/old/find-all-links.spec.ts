import { test, expect } from '@playwright/test';

const FIRST_COMPONENT_URL = 'https://sonic.staging.jet-internal.com/components/offermanagementofferstore';

test.describe('Find All Links on First Component URL', () => {
  test('Extract and list all href links from the page', async ({ page }) => {
    console.log(`\n=== FINDING ALL LINKS ON FIRST COMPONENT URL ===`);
    console.log(`URL: ${FIRST_COMPONENT_URL}`);
    console.log(`===========================================\n`);

    try {
      // Navigate to the component page
      const response = await page.goto(FIRST_COMPONENT_URL, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });

      console.log(`✓ Page loaded successfully (Status: ${response?.status()})`);

      // Wait for the page to be fully loaded and JavaScript to execute
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000); // Additional wait for dynamic content

      // Find all anchor tags with href attributes
      const anchorTags = await page.locator('a[href]').all();

      console.log(`Found ${anchorTags.length} anchor tags with href attributes:\n`);

      const allLinks: Array<{href: string, text: string, absoluteUrl: string}> = [];

      // Extract href, text, and resolve to absolute URLs
      for (let i = 0; i < anchorTags.length; i++) {
        const anchor = anchorTags[i];
        const href = await anchor.getAttribute('href');
        const text = await anchor.textContent();

        if (href) {
          // Resolve relative URLs to absolute URLs
          let absoluteUrl: string;
          try {
            absoluteUrl = new URL(href, FIRST_COMPONENT_URL).href;
          } catch {
            absoluteUrl = href; // Keep as-is if invalid
          }

          const linkInfo = {
            href: href,
            text: text?.trim() || '',
            absoluteUrl: absoluteUrl
          };

          allLinks.push(linkInfo);

          console.log(`Link ${i + 1}:`);
          console.log(`  Original href: ${href}`);
          console.log(`  Absolute URL: ${absoluteUrl}`);
          console.log(`  Link text: "${text?.trim()}"`);
          console.log('');
        }
      }

      console.log(`=== SUMMARY ===`);
      console.log(`Total links found: ${allLinks.length}`);
      console.log(`Unique domains: ${[...new Set(allLinks.map(link => {
        try {
          return new URL(link.absoluteUrl).hostname;
        } catch {
          return 'invalid-url';
        }
      }))].join(', ')}`);

      // Assertions
      expect(response?.status()).toBeLessThan(400);
      expect(allLinks.length).toBeGreaterThanOrEqual(0);

      console.log(`\n=== TEST COMPLETED SUCCESSFULLY ===`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`✗ Test failed: ${errorMessage}`);
      throw error;
    }
  });
});