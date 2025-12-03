const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * Dead Link Checker for Documentation URLs
 * 
 * This script reads the allDocs.json file and checks all documentation URLs
 * to identify any dead links.
 */

const BASE_URL = 'https://sonic.staging.jet-internal.com/docs/';
const JSON_FILE_PATH = path.join(__dirname, 'allDocs.json');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

/**
 * Check if a URL is accessible
 * @param {string} url - The URL to check
 * @returns {Promise<{url: string, status: number, success: boolean, error?: string}>}
 */
function checkUrl(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'HEAD', // Use HEAD to avoid downloading the entire page
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'DeadLinkChecker/1.0'
      }
    };

    const req = client.request(options, (res) => {
      const success = res.statusCode >= 200 && res.statusCode < 400;
      resolve({
        url,
        status: res.statusCode,
        success,
        error: success ? null : `HTTP ${res.statusCode}`
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({
        url,
        status: 0,
        success: false,
        error: 'Request timeout'
      });
    });

    req.on('error', (err) => {
      resolve({
        url,
        status: 0,
        success: false,
        error: err.message
      });
    });

    req.end();
  });
}

/**
 * Load and parse the JSON file
 * @returns {Array} Array of document objects
 */
function loadDocuments() {
  try {
    const data = fs.readFileSync(JSON_FILE_PATH, 'utf8');
    const parsed = JSON.parse(data);
    return parsed.documents || [];
  } catch (error) {
    console.error(`${colors.red}Error reading JSON file: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

/**
 * Check all URLs with progress tracking
 * @param {Array} urls - Array of URLs to check
 * @returns {Promise<Array>} Array of check results
 */
async function checkAllUrls(urls) {
  const results = [];
  const total = urls.length;
  
  console.log(`${colors.blue}${colors.bold}Starting to check ${total} URLs...${colors.reset}\n`);
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const progress = `[${i + 1}/${total}]`;
    
    process.stdout.write(`${colors.yellow}${progress} Checking: ${url}...${colors.reset}`);
    
    const result = await checkUrl(url);
    results.push(result);
    
    if (result.success) {
      process.stdout.write(`${colors.green} ✓ OK (${result.status})${colors.reset}\n`);
    } else {
      process.stdout.write(`${colors.red} ✗ FAILED (${result.error})${colors.reset}\n`);
    }
  }
  
  return results;
}

/**
 * Generate a summary report
 * @param {Array} results - Array of check results
 */
function generateReport(results) {
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\n${colors.bold}=== DEAD LINK CHECK REPORT ===${colors.reset}`);
  console.log(`Total URLs checked: ${results.length}`);
  console.log(`${colors.green}Successful: ${successful.length}${colors.reset}`);
  console.log(`${colors.red}Failed: ${failed.length}${colors.reset}`);
  
  if (failed.length > 0) {
    console.log(`\n${colors.red}${colors.bold}DEAD LINKS FOUND:${colors.reset}`);
    console.log(`${colors.red}==================${colors.reset}`);
    
    failed.forEach((result, index) => {
      console.log(`${colors.red}${index + 1}. ${result.url}${colors.reset}`);
      console.log(`   ${colors.red}Error: ${result.error}${colors.reset}\n`);
    });
    
    // Write failed URLs to a file for further investigation
    const failedUrls = failed.map(r => `${r.url} - ${r.error}`).join('\n');
    fs.writeFileSync('dead-links-report.txt', failedUrls);
    console.log(`${colors.yellow}Dead links have been saved to 'dead-links-report.txt'${colors.reset}`);
  } else {
    console.log(`\n${colors.green}${colors.bold}🎉 All links are working!${colors.reset}`);
  }
  
  // Calculate and display statistics
  const statusCodes = {};
  results.forEach(r => {
    const code = r.status || 'Error';
    statusCodes[code] = (statusCodes[code] || 0) + 1;
  });
  
  console.log(`\n${colors.bold}Status Code Distribution:${colors.reset}`);
  Object.entries(statusCodes)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([code, count]) => {
      const color = code.toString().startsWith('2') ? colors.green : 
                   code.toString().startsWith('3') ? colors.yellow : colors.red;
      console.log(`  ${color}${code}: ${count}${colors.reset}`);
    });
}

/**
 * Main function
 */
async function main() {
  console.log(`${colors.bold}Dead Link Checker for Documentation${colors.reset}`);
  console.log(`${colors.bold}====================================${colors.reset}`);
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`JSON File: ${JSON_FILE_PATH}\n`);
  
  // Load documents
  const documents = loadDocuments();
  console.log(`Loaded ${documents.length} documents from JSON file.`);
  
  // Extract and build URLs
  const urls = documents.map(doc => BASE_URL + doc.relativePath);
  console.log(`Generated ${urls.length} URLs to check.\n`);
  
  // Check all URLs
  const results = await checkAllUrls(urls);
  
  // Generate report
  generateReport(results);
  
  // Exit with error code if there are dead links
  const deadLinks = results.filter(r => !r.success);
  if (deadLinks.length > 0) {
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(`${colors.red}Uncaught Exception: ${error.message}${colors.reset}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(`${colors.red}Unhandled Rejection at:`, promise, `reason: ${reason}${colors.reset}`);
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = { checkUrl, loadDocuments, checkAllUrls, generateReport };