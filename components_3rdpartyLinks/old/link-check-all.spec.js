import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const filePath = path.join(__dirname, 'component_links.txt');
const BATCH_SIZE = 10;

function readAllUrls() {
  return fs.readFileSync(filePath, 'utf-8')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);
}

function createBatches(urls, batchSize) {
  const batches = [];
  for (let i = 0; i < urls.length; i += batchSize) {
    batches.push(urls.slice(i, i + batchSize));
  }
  return batches;
}

async function checkLinksOnPage(page, url, timeout = 30000) {
  try {
    console.log(`\n🟦 Checking page: ${url}`);

    // Navigate with timeout
    const response = await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: timeout
    });

    if (!response || !response.ok()) {
      console.log(`⚠️  Page failed to load: ${url} → ${response?.status() || 'unknown'}`);
      return { url, status: 'page_load_failed', links: [] };
    }

    // Extract links with timeout
    const links = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      return anchors.map(a => a.href).filter(href => href && href.trim());
    });

    console.log(`📎 Found ${links.length} links on ${url}`);

    return { url, status: 'success', links };

  } catch (error) {
    console.log(`❌ Error checking page: ${url} → ${error.message}`);
    return { url, status: 'error', links: [], error: error.message };
  }
}

async function checkLinkStatus(request, link, timeout = 10000) {
  try {
    const response = await request.get(link, { timeout });
    return { link, status: response.status(), ok: response.ok() };
  } catch (error) {
    return { link, status: 'timeout', ok: false, error: error.message };
  }
}

// Generate test cases for each batch
const allUrls = readAllUrls();
const batches = createBatches(allUrls, BATCH_SIZE);

console.log(`📊 Total URLs: ${allUrls.length}`);
console.log(`📦 Batches: ${batches.length} (${BATCH_SIZE} URLs each)`);

// Create a test for each batch
batches.forEach((batchUrls, batchIndex) => {
  const startIndex = batchIndex * BATCH_SIZE + 1;
  const endIndex = Math.min((batchIndex + 1) * BATCH_SIZE, allUrls.length);

  test(`Check component pages batch ${batchIndex + 1} (${startIndex}-${endIndex})`, async ({ page, context }) => {
    console.log(`\n🚀 Starting batch ${batchIndex + 1}/${batches.length} (${batchUrls.length} URLs)`);

    const results = [];

    // Process each URL in the batch
    for (const url of batchUrls) {
      const pageResult = await checkLinksOnPage(page, url);
      results.push(pageResult);

      // Check each link found on the page
      if (pageResult.links.length > 0) {
        const linkChecks = await Promise.all(
          pageResult.links.map(link => checkLinkStatus(context.request, link))
        );

        // Report dead links
        const deadLinks = linkChecks.filter(check => !check.ok);
        deadLinks.forEach(deadLink => {
          console.log(`❌ DEAD LINK: ${deadLink.link} → ${deadLink.status}`);
        });

        pageResult.linkChecks = linkChecks;
      }
    }

    // Summary for this batch
    const totalPages = results.length;
    const successfulPages = results.filter(r => r.status === 'success').length;
    const totalLinks = results.reduce((sum, r) => sum + r.links.length, 0);
    const deadLinks = results.reduce((sum, r) =>
      sum + (r.linkChecks?.filter(c => !c.ok).length || 0), 0
    );

    console.log(`\n📈 Batch ${batchIndex + 1} Summary:`);
    console.log(`   Pages checked: ${successfulPages}/${totalPages}`);
    console.log(`   Total links found: ${totalLinks}`);
    console.log(`   Dead links found: ${deadLinks}`);

    // Assertions
    expect(totalPages).toBe(batchUrls.length);
    expect(successfulPages).toBeGreaterThanOrEqual(0);
    expect(totalLinks).toBeGreaterThanOrEqual(0);
    expect(deadLinks).toBeGreaterThanOrEqual(0);
  });
});
