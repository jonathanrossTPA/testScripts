import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const filePath = path.join(__dirname, 'component_links.txt');

function readUrls(limit) {
  return fs.readFileSync(filePath, 'utf-8')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .slice(0, limit);
}

test('Check first 10 component pages for dead links', async ({ page, request }) => {
  const urls = readUrls(10);

  for (const url of urls) {
    console.log(`\n🟦 Checking page: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle' });

    // Shadow DOM + regular DOM extraction
    const links = await page.evaluate(() => {
      function getAllLinks(root) {
        let collected = [];
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
        while (walker.nextNode()) {
          const node = walker.currentNode;
          if (node.shadowRoot) {
            collected = collected.concat(getAllLinks(node.shadowRoot));
          }
          if (node.tagName === 'A' && node.href) {
            collected.push(node.href);
          }
        }
        return collected;
      }
      return Array.from(new Set(getAllLinks(document)));
    });

    console.log(`Found ${links.length} links`);

    for (const link of links) {
      const resp = await request.get(link);
      if (!resp.ok()) {
        console.log(`❌ DEAD LINK: ${link} → ${resp.status()}`);
      }
    }
  }
});
