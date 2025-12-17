import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const filePath = path.join(__dirname, 'component_links.txt');
const reportPath = path.join(__dirname, 'link-report.md');

function readUrls(limit) {
  return fs.readFileSync(filePath, 'utf-8')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .slice(0, limit);
}

async function extractLinks(page) {
  return await page.evaluate(() => {
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
}

(async () => {
  const urls = readUrls(10);
  const browser = await chromium.launch();
  const page = await browser.newPage();

  let md = `# Link Report\n\nGenerated: ${new Date().toISOString()}\n\n`;

  for (const url of urls) {
    console.log(`Processing: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle' });

    const links = await extractLinks(page);

    md += `## ${url}\n\n`;
    md += `| # | Link |\n|---|------|\n`;

    links.forEach((l, i) => {
      md += `| ${i + 1} | ${l} |\n`;
    });

    md += `\n`;
  }

  await browser.close();
  fs.writeFileSync(reportPath, md);
  console.log(`Report written to ${reportPath}`);
})();
