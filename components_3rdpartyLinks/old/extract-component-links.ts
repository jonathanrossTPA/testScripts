import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { JSDOM } from 'jsdom';

interface ComponentLink {
  componentName: string;
  componentUrl: string;
  allLinks: string[];
}

const BASE_URL = 'https://sonic.staging.jet-internal.com/components/';
const OUTPUT_FILE = path.join(__dirname, 'component_with_all_links.json');
const LINKS_FILE = path.join(__dirname, 'component_links.txt');

function extractAllLinksFromHtml(html: string): string[] {
  try {
    const dom = new JSDOM(html);
    const links = new Set<string>();
    
    // Extract all links from anchor tags
    const anchors = dom.window.document.querySelectorAll('a[href]');
    anchors.forEach((anchor: any) => {
      const href = anchor.getAttribute('href');
      if (href) {
        try {
          // Resolve relative URLs
          const absoluteUrl = new URL(href, BASE_URL).href;
          links.add(absoluteUrl);
        } catch {
          // Invalid URL, skip
        }
      }
    });
    
    return Array.from(links);
  } catch (error) {
    console.error('Error parsing HTML:', error);
    return [];
  }
}

async function fetchComponentPage(componentName: string): Promise<ComponentLink | null> {
  const componentUrl = `${BASE_URL}${componentName}`;
  
  try {
    console.log(`Fetching: ${componentUrl}`);
    const response = await axios.get(componentUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    const allLinks = extractAllLinksFromHtml(response.data);
    console.log(`  Found ${allLinks.length} links`);
    
    return {
      componentName,
      componentUrl,
      allLinks,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`  Error fetching ${componentUrl}: ${errorMessage}`);
    return {
      componentName,
      componentUrl,
      allLinks: [],
    };
  }
}

async function main() {
  console.log('Starting component link extraction...\n');
  
  // Read component links from file
  if (!fs.existsSync(LINKS_FILE)) {
    console.error(`File not found: ${LINKS_FILE}`);
    process.exit(1);
  }
  
  const linksContent = fs.readFileSync(LINKS_FILE, 'utf-8');
  const componentLinks = linksContent
    .split('\n')
    .filter(line => line.trim())
    .map(url => url.replace(BASE_URL, ''))
    .filter(name => name);
  
  console.log(`Total components to process: ${componentLinks.length}\n`);
  
  const results: ComponentLink[] = [];
  let processed = 0;
  
  // Process components in batches to avoid overwhelming the server
  const BATCH_SIZE = 5;
  for (let i = 0; i < componentLinks.length; i += BATCH_SIZE) {
    const batch = componentLinks.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(componentName => fetchComponentPage(componentName))
    );
    
    results.push(...batchResults.filter((result): result is ComponentLink => result !== null));
    processed += batch.length;
    
    console.log(`Progress: ${processed}/${componentLinks.length}\n`);
    
    // Rate limiting - wait between batches
    if (i + BATCH_SIZE < componentLinks.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Save results
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to: ${OUTPUT_FILE}`);
  
  // Generate summary
  const totalLinks = results.reduce((sum, r) => sum + r.allLinks.length, 0);
  console.log(`\nSummary:`);
  console.log(`  Components processed: ${results.length}`);
  console.log(`  Total links found: ${totalLinks}`);
  console.log(`  Average links per component: ${(totalLinks / results.length).toFixed(2)}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
