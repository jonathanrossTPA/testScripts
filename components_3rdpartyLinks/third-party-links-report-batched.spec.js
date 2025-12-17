import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Input files in same folder
const urlListPaths = [
  path.join(__dirname, 'component_links_part1.csv'),
  path.join(__dirname, 'component_links_part2.csv'),
  path.join(__dirname, 'component_links_part3.csv')
];

// Output CSV file
const csvPath = path.join(__dirname, 'external-link-report.csv');

// Read URLs from all CSV files
function readUrlsFromFile() {
  const allUrls = [];
  urlListPaths.forEach(filePath => {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const urls = content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.replace(/^"|"$/g, '')); // Remove surrounding quotes
      allUrls.push(...urls);
    }
  });
  return allUrls;
}

// Split array into batches
function chunk(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

// Extract 3rd-party links including inside shadow DOM
async function extractThirdPartyLinks(page) {
  return await page.evaluate(() => {
    const currentOrigin = location.origin;

    function extractLinks(root) {
      let links = [];
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);

      while (walker.nextNode()) {
        const el = walker.currentNode;

        if (el.shadowRoot) {
          links = links.concat(extractLinks(el.shadowRoot));
        }

        if (el.tagName === 'A' && el.href) {
          links.push(el.href);
        }
      }
      return links;
    }

    const allLinks = Array.from(new Set(extractLinks(document)));

    return allLinks.filter(link => !link.startsWith(currentOrigin));
  });
}

// Prepare CSV file
test.beforeAll(() => {
  if (fs.existsSync(csvPath)) fs.unlinkSync(csvPath);

  fs.writeFileSync(
    csvPath,
    `source_url,third_party_link,status\n`,
    'utf-8'
  );
});

test.describe('Batch scan source URLs and generate CSV report', () => {
  const urls = readUrlsFromFile();
  const batches = chunk(urls, 10); // Changed from 20 to 10

  console.log(`📄 Loaded ${urls.length} URLs`);
  console.log(`📦 Processing in ${batches.length} batches of 10\n`);

  // Create a separate test for each batch
  batches.forEach((batch, batchIndex) => {
    test(`Batch ${batchIndex + 1}/${batches.length} - ${batch.length} URLs`, async ({ page, request }) => {
      console.log(`\n🚀 Starting batch ${batchIndex + 1}/${batches.length}`);
      console.log(`   Contains ${batch.length} URLs`);

      for (const url of batch) {
        console.log(`\n🌐 Checking: ${url}`);

        try {
          await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

          const thirdPartyLinks = await extractThirdPartyLinks(page);

          if (thirdPartyLinks.length === 0) {
            fs.appendFileSync(
              csvPath,
              `"${url}",NO_LINKS_FOUND,""\n`
            );
            console.log('✔ No third-party links found.');
            continue;
          }

          for (const link of thirdPartyLinks) {
            let status = 'OK';

            try {
              const response = await request.get(link, { timeout: 8000 });
              if (!response.ok()) status = `DEAD_${response.status()}`;
            } catch (err) {
              status = 'DEAD_NETWORK_ERROR';
            }

            // Write CSV row
            fs.appendFileSync(
              csvPath,
              `"${url}","${link}","${status}"\n`
            );
          }

          console.log(`✔ Processed ${thirdPartyLinks.length} 3rd-party links`);
        } catch (error) {
          console.log(`❌ Failed to process ${url}: ${error.message}`);
          // Still write to CSV for failed URLs
          fs.appendFileSync(
            csvPath,
            `"${url}",PAGE_LOAD_ERROR,""\n`
          );
        }
      }

      console.log(`✅ Batch ${batchIndex + 1} completed`);
    });
  });
});
