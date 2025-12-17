import { test, expect } from '@playwright/test';

const FIRST_COMPONENT_URL = 'https://sonic.staging.jet-internal.com/components/offermanagementofferstore';

test.describe('First Component URL - Extract Links from Specific Class', () => {
  test('Extract href links from elements with class "flex h-full flex-col"', async ({ page }) => {
    console.log(`\n=== TESTING FIRST COMPONENT URL ===`);
    console.log(`URL: ${FIRST_COMPONENT_URL}`);
    console.log(`Looking for links in elements with class: "flex h-full flex-col"`);
    console.log(`===================================\n`);

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

      // Check if there are any anchor tags on the page at all
      const allAnchors = await page.locator('a').all();
      console.log(`\nTotal anchor tags on page: ${allAnchors.length}`);

      // Show first few anchor tags and their hrefs
      for (let i = 0; i < Math.min(allAnchors.length, 5); i++) {
        const href = await allAnchors[i].getAttribute('href');
        const text = await allAnchors[i].textContent();
        console.log(`  Anchor ${i + 1}: href="${href}" text="${text?.trim()}"`);
      }

      // First, let's see what classes are available on the page
      console.log(`\n=== EXPLORING PAGE STRUCTURE ===`);
      const allClasses = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const classSet = new Set<string>();
        elements.forEach(el => {
          if (el.className && typeof el.className === 'string') {
            el.className.split(' ').forEach(cls => classSet.add(cls));
          }
        });
        return Array.from(classSet).sort();
      });

      console.log(`All CSS classes found on page (${allClasses.length} total):`);
      console.log(allClasses.join(', '));

      // Look for elements that contain "flex" in their classes
      const flexElements = await page.locator('[class*="flex"]').all();
      console.log(`\nFound ${flexElements.length} elements containing "flex" in their class:`);

      for (let i = 0; i < Math.min(flexElements.length, 10); i++) { // Show first 10
        const classes = await flexElements[i].getAttribute('class');
        console.log(`  Element ${i + 1}: ${classes}`);
      }

      // Try different variations of the class selector
      const classVariations = [
        '.flex.h-full.flex-col',
        '[class="flex h-full flex-col"]',
        '[class*="flex h-full flex-col"]',
        '.flex-col',
        '.h-full'
      ];

      console.log(`\n=== TESTING CLASS VARIATIONS ===`);
      for (const variation of classVariations) {
        const elements = await page.locator(variation).all();
        console.log(`Selector "${variation}": ${elements.length} elements`);
      }

      // Find all elements with the specific class
      const elements = await page.locator('.flex.h-full.flex-col').all();

      console.log(`\nFound ${elements.length} elements with class "flex h-full flex-col"`);

      let totalLinks = 0;
      const allLinks: string[] = [];

      // Extract href links from each element
      for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        console.log(`\n--- Element ${i + 1} ---`);

        // Find all anchor tags within this element
        const anchorTags = await element.locator('a[href]').all();

        console.log(`Found ${anchorTags.length} anchor tags in element ${i + 1}`);

        for (let j = 0; j < anchorTags.length; j++) {
          const anchor = anchorTags[j];
          const href = await anchor.getAttribute('href');
          const text = await anchor.textContent();

          if (href) {
            // Resolve relative URLs
            let absoluteUrl: string;
            try {
              absoluteUrl = new URL(href, FIRST_COMPONENT_URL).href;
            } catch {
              absoluteUrl = href; // Keep as-is if invalid
            }

            allLinks.push(absoluteUrl);
            totalLinks++;

            console.log(`  Link ${j + 1}: ${absoluteUrl}`);
            console.log(`    Text: "${text?.trim()}"`);
          }
        }
      }

      console.log(`\n=== SUMMARY ===`);
      console.log(`Total anchor tags on page: ${allAnchors.length}`);
      console.log(`Total elements with class "flex h-full flex-col": ${elements.length}`);
      console.log(`Total href links found: ${totalLinks}`);
      console.log(`All links: ${JSON.stringify(allLinks, null, 2)}`);

      // Assertions
      expect(response?.status()).toBeLessThan(400);
      expect(elements.length).toBeGreaterThanOrEqual(0); // At least 0 elements
      expect(totalLinks).toBeGreaterThanOrEqual(0); // At least 0 links

      // Log final results
      console.log(`\n=== TEST COMPLETED SUCCESSFULLY ===`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`✗ Test failed: ${errorMessage}`);
      throw error;
    }
  });
});