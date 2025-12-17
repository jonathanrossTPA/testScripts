// docs-vs-components.spec.js
// Playwright test suite for SON-2859: Add docs to component pages
// Covers: UI validation, API validation, doc-component matching, analytics endpoint, and dead link checks

const { test, expect, request } = require('@playwright/test');
const fs = require('fs/promises');

const BASE_URL = 'https://sonic.staging.jet-internal.com';
const API_BASE = 'https://sonicportalapi.pl-soft-change-sonic.pdv-5.eu-west-1.staging.jet-internal.com';

// Credentials from environment variables (set PLAYWRIGHT_USERNAME and PLAYWRIGHT_PASSWORD)
const USERNAME = process.env.PLAYWRIGHT_USERNAME || 'YOUR_USERNAME';
const PASSWORD = process.env.PLAYWRIGHT_PASSWORD || 'YOUR_PASSWORD';

// Utility: Normalize names for matching
function normalizeName(name) {
  return name.replace(/-/g, '').toLowerCase();
}

test.describe('SON-2859 Docs vs Components', () => {
  let bearerToken;
  let componentList = [];
  let documentList = [];
  let comparison = [];

  // Helper: Perform login
  async function login(page) {
    await page.goto(BASE_URL + '/login');
    // Accept cookies if the button is present
    if (await page.$('[data-test-id="actions-accept-all"]')) {
      await page.click('[data-test-id="actions-accept-all"]');
    }
    // Click the Okta login button to start SSO
    await page.waitForSelector('#root > div > div > div > form > button', { timeout: 10000 });
    await page.click('#root > div > div > div > form > button');
    // Wait for Okta login form
    await page.waitForSelector('input#okta-signin-username, input[name="username"]', { timeout: 15000 });
    // Fill username (Okta selectors)
    if (await page.$('input#okta-signin-username')) {
      await page.fill('input#okta-signin-username', USERNAME);
    } else {
      await page.fill('input[name="username"]', USERNAME);
    }
    // Fill password (Okta selectors)
    if (await page.$('input#okta-signin-password')) {
      await page.fill('input#okta-signin-password', PASSWORD);
    } else {
      await page.fill('input[name="password"]', PASSWORD);
    }
    // Click Okta submit button
    if (await page.$('input#okta-signin-submit')) {
      await page.click('input#okta-signin-submit');
    } else if (await page.$('button[type="submit"]')) {
      await page.click('button[type="submit"]');
    } else if (await page.$('input[type="submit"]')) {
      await page.click('input[type="submit"]');
    } else {
      throw new Error('Okta login button not found. Please update the selector.');
    }
    // Wait for redirect to main app (adjust selector as needed)
    await page.waitForURL(BASE_URL + '/components', { timeout: 30000 });
  }

  test('Automated login and capture bearer token', async ({ page }) => {
    await login(page);
    // Extract Bearer token from okta-token-storage-sonic-v1 > idToken > accessToken
    bearerToken = await page.evaluate(() => {
      const oktaStorage = localStorage.getItem('okta-token-storage-sonic-v1');
      if (!oktaStorage) return null;
      try {
        const parsed = JSON.parse(oktaStorage);
        return parsed.idToken && parsed.idToken.accessToken ? parsed.idToken.accessToken : null;
      } catch (e) {
        return null;
      }
    });
    expect(bearerToken).toBeTruthy();
  });
  test('Fetch component and document lists', async ({ request }) => {
    // Get components
    const compResp = await request.get(`${API_BASE}/catalog/applications`);
    expect(compResp.ok()).toBeTruthy();
    const compJson = await compResp.json();
    componentList = compJson.map(c => c.name);

    // Get documents
    const docResp = await request.get(`${API_BASE}/static/docs/metadata/component`);
    expect(docResp.ok()).toBeTruthy();
    const docJson = await docResp.json();
    documentList = docJson.map(d => d.title);
  });

  test('Compare components and documents, generate file', async () => {
    comparison = componentList.map(name => {
      const match = documentList.find(doc => normalizeName(doc) === normalizeName(name));
      return {
        component: name,
        hasDoc: !!match,
        docTitle: match || null,
        componentUrl: `${BASE_URL}/components/${name}/`,
        docsTabUrl: `${BASE_URL}/components/${name}/docs`,
      };
    });
    await fs.writeFile('DocsVSComponents/comparison.json', JSON.stringify(comparison, null, 2));
  });

  test.describe('Component Docs Tab UI', () => {
    test('Each component has Docs tab and Beta label', async ({ page }) => {
      for (const { component, hasDoc, docsTabUrl } of comparison) {
        if (!hasDoc) continue;
        await page.goto(`${BASE_URL}/components/${component}/`);
        // Check for Docs tab
        const docsTab = await page.locator('text=Docs').first();
        await expect(docsTab).toBeVisible();
        // Check for Beta label
        const betaLabel = await page.locator('text=Beta').first();
        await expect(betaLabel).toBeVisible();
      }
    });
    test('Docs tab displays correct document', async ({ page }) => {
      for (const { component, hasDoc, docTitle, docsTabUrl } of comparison) {
        if (!hasDoc) continue;
        await page.goto(docsTabUrl);
        // Check document title is present
        const docTitleLocator = await page.locator(`text=${docTitle}`).first();
        await expect(docTitleLocator).toBeVisible();
      }
    });
  });

  test('Sample components contain correct Doc', async ({ page }) => {
    // Sample 5 components
    const sample = comparison.filter(c => c.hasDoc).slice(0, 5);
    for (const { docsTabUrl, docTitle } of sample) {
      await page.goto(docsTabUrl);
      const docTitleLocator = await page.locator(`text=${docTitle}`).first();
      await expect(docTitleLocator).toBeVisible();
    }
  });

  test('Docs are well formatted', async ({ page }) => {
    // Sample 5 components
    const sample = comparison.filter(c => c.hasDoc).slice(0, 5);
    for (const { docsTabUrl } of sample) {
      await page.goto(docsTabUrl);
      // Check for at least one heading and paragraph
      await expect(page.locator('h1,h2,h3')).toHaveCountGreaterThan(0);
      await expect(page.locator('p')).toHaveCountGreaterThan(0);
    }
  });

  test('Analytics endpoint returns 200 for Docs tab', async ({ request }) => {
    for (const { component } of comparison) {
      const analyticsUrl = `${API_BASE}/user-interactions/analytics/component%2F${component}%2Findex.html`;
      const resp = await request.get(analyticsUrl);
      expect(resp.status()).toBe(200);
    }
  });

  test('Dead link check for Docs tab URLs', async ({ request }) => {
    for (const { docsTabUrl } of comparison) {
      const resp = await request.get(docsTabUrl);
      expect([200, 401, 403]).toContain(resp.status()); // Accept 200, 401, 403
    }
  });
});
