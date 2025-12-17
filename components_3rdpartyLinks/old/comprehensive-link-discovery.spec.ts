import { test, expect } from '@playwright/test';

const FIRST_COMPONENT_URL = 'https://sonic.staging.jet-internal.com/components/offermanagementofferstore';

test.describe('Comprehensive Link Discovery - First Component URL', () => {
  test('Find all types of links on the component page', async ({ page }) => {
    console.log(`\n=== COMPREHENSIVE LINK DISCOVERY ===`);
    console.log(`URL: ${FIRST_COMPONENT_URL}`);
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
      await page.waitForTimeout(3000); // Additional wait for dynamic content

      console.log(`\n=== ANALYZING PAGE CONTENT ===`);

      // Get page title
      const title = await page.title();
      console.log(`Page Title: "${title}"`);

      // Get page URL
      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);

      // 1. Find all anchor tags (<a>)
      console.log(`\n=== 1. ANCHOR TAGS (<a>) ===`);
      const anchorTags = await page.locator('a').all();
      console.log(`Found ${anchorTags.length} anchor tags`);

      const anchorLinks: Array<{href: string, text: string, visible: boolean}> = [];

      for (let i = 0; i < anchorTags.length; i++) {
        const anchor = anchorTags[i];
        const href = await anchor.getAttribute('href');
        const text = await anchor.textContent();
        const isVisible = await anchor.isVisible();

        if (href) {
          let absoluteUrl: string;
          try {
            absoluteUrl = new URL(href, FIRST_COMPONENT_URL).href;
          } catch {
            absoluteUrl = href;
          }

          anchorLinks.push({
            href: absoluteUrl,
            text: text?.trim() || '',
            visible: isVisible
          });

          console.log(`  ${i + 1}. ${absoluteUrl}`);
          console.log(`     Text: "${text?.trim()}"`);
          console.log(`     Visible: ${isVisible}`);
        }
      }

      // 2. Find all elements with href attributes (not just <a> tags)
      console.log(`\n=== 2. ALL ELEMENTS WITH href ATTRIBUTES ===`);
      const hrefElements = await page.locator('[href]').all();
      console.log(`Found ${hrefElements.length} elements with href attributes`);

      const allHrefLinks: Array<{tagName: string, href: string, text: string}> = [];

      for (let i = 0; i < hrefElements.length; i++) {
        const element = hrefElements[i];
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        const href = await element.getAttribute('href');
        const text = await element.textContent();

        if (href) {
          let absoluteUrl: string;
          try {
            absoluteUrl = new URL(href, FIRST_COMPONENT_URL).href;
          } catch {
            absoluteUrl = href;
          }

          allHrefLinks.push({
            tagName,
            href: absoluteUrl,
            text: text?.trim() || ''
          });

          console.log(`  ${i + 1}. <${tagName}> ${absoluteUrl}`);
          console.log(`     Text: "${text?.trim()}"`);
        }
      }

      // 3. Find all elements with onclick attributes that might contain links
      console.log(`\n=== 3. ELEMENTS WITH onclick ATTRIBUTES ===`);
      const onclickElements = await page.locator('[onclick]').all();
      console.log(`Found ${onclickElements.length} elements with onclick attributes`);

      for (let i = 0; i < onclickElements.length; i++) {
        const element = onclickElements[i];
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        const onclick = await element.getAttribute('onclick');
        const text = await element.textContent();

        console.log(`  ${i + 1}. <${tagName}> onclick: ${onclick?.substring(0, 100)}${onclick && onclick.length > 100 ? '...' : ''}`);
        console.log(`     Text: "${text?.trim()}"`);
      }

      // 4. Find all elements with data-href or similar link attributes
      console.log(`\n=== 4. ELEMENTS WITH LINK-LIKE ATTRIBUTES ===`);
      const linkAttributes = ['data-href', 'data-url', 'data-link', 'ng-href', 'xlink:href'];
      let totalLinkAttrs = 0;

      for (const attr of linkAttributes) {
        const elements = await page.locator(`[${attr}]`).all();
        if (elements.length > 0) {
          console.log(`Found ${elements.length} elements with ${attr}:`);
          totalLinkAttrs += elements.length;

          for (let i = 0; i < elements.length; i++) {
            const element = elements[i];
            const tagName = await element.evaluate(el => el.tagName.toLowerCase());
            const attrValue = await element.getAttribute(attr);
            const text = await element.textContent();

            console.log(`  ${i + 1}. <${tagName}> ${attr}: ${attrValue}`);
            console.log(`     Text: "${text?.trim()}"`);
          }
        }
      }

      if (totalLinkAttrs === 0) {
        console.log(`No elements found with link-like attributes (${linkAttributes.join(', ')})`);
      }

      // 5. Check for JavaScript-generated links or dynamic content
      console.log(`\n=== 5. DYNAMIC CONTENT ANALYSIS ===`);
      const bodyText = await page.locator('body').textContent();
      console.log(`Body text length: ${bodyText?.length || 0} characters`);

      // Look for URL patterns in the text content
      const urlRegex = /(https?:\/\/[^\s<>"']+)/g;
      const textUrls = bodyText?.match(urlRegex) || [];
      console.log(`Found ${textUrls.length} URL patterns in text content:`);
      textUrls.forEach((url, i) => {
        console.log(`  ${i + 1}. ${url}`);
      });

      // 6. Check for form actions
      console.log(`\n=== 6. FORM ELEMENTS ===`);
      const forms = await page.locator('form').all();
      console.log(`Found ${forms.length} form elements`);

      for (let i = 0; i < forms.length; i++) {
        const form = forms[i];
        const action = await form.getAttribute('action');
        const method = await form.getAttribute('method') || 'GET';

        console.log(`  Form ${i + 1}: action="${action}" method="${method}"`);
      }

      // 7. Check for iframe sources
      console.log(`\n=== 7. IFRAME ELEMENTS ===`);
      const iframes = await page.locator('iframe').all();
      console.log(`Found ${iframes.length} iframe elements`);

      for (let i = 0; i < iframes.length; i++) {
        const iframe = iframes[i];
        const src = await iframe.getAttribute('src');

        console.log(`  Iframe ${i + 1}: src="${src}"`);
      }

      // 8. Check for meta refresh or other redirects
      console.log(`\n=== 8. META TAGS ===`);
      const metaTags = await page.locator('meta').all();
      console.log(`Found ${metaTags.length} meta tags`);

      for (let i = 0; i < metaTags.length; i++) {
        const meta = metaTags[i];
        const httpEquiv = await meta.getAttribute('http-equiv');
        const content = await meta.getAttribute('content');

        if (httpEquiv || content) {
          console.log(`  Meta ${i + 1}: http-equiv="${httpEquiv}" content="${content}"`);
        }
      }

      // SUMMARY
      console.log(`\n=== COMPREHENSIVE LINK SUMMARY ===`);
      console.log(`Page URL: ${currentUrl}`);
      console.log(`Page Title: "${title}"`);
      console.log(`Anchor tags: ${anchorLinks.length}`);
      console.log(`All href elements: ${allHrefLinks.length}`);
      console.log(`Onclick elements: ${onclickElements.length}`);
      console.log(`Link-like attributes: ${totalLinkAttrs}`);
      console.log(`URL patterns in text: ${textUrls.length}`);
      console.log(`Forms: ${forms.length}`);
      console.log(`Iframes: ${iframes.length}`);
      console.log(`Meta tags: ${metaTags.length}`);

      const allUniqueLinks = new Set([
        ...anchorLinks.map(l => l.href),
        ...allHrefLinks.map(l => l.href),
        ...textUrls
      ]);

      console.log(`\nTotal unique links found: ${allUniqueLinks.size}`);
      console.log(`All unique links: ${JSON.stringify(Array.from(allUniqueLinks), null, 2)}`);

      // Assertions
      expect(response?.status()).toBeLessThan(400);

      console.log(`\n=== DISCOVERY COMPLETED SUCCESSFULLY ===`);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`✗ Discovery failed: ${errorMessage}`);
      throw error;
    }
  });
});