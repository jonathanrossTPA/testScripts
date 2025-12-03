/**
 * Simple test runner for the dead link checker
 * 
 * This file demonstrates how to use the deadlink-checker module
 * and can be used for testing specific URLs or running partial checks.
 */

const { checkUrl, loadDocuments, checkAllUrls } = require('./deadlink-checker');

/**
 * Test a single URL
 */
async function testSingleUrl() {
  console.log('Testing a single URL...\n');
  
  const testUrl = 'https://sonic.staging.jet-internal.com/docs/component/restaurantmenumanagernotifications/index.html';
  const result = await checkUrl(testUrl);
  
  console.log(`URL: ${result.url}`);
  console.log(`Status: ${result.status}`);
  console.log(`Success: ${result.success}`);
  if (result.error) {
    console.log(`Error: ${result.error}`);
  }
}

/**
 * Test first 5 URLs from the JSON file
 */
async function testFirstFiveUrls() {
  console.log('\nTesting first 5 URLs from allDocs.json...\n');
  
  const documents = loadDocuments();
  const firstFive = documents.slice(0, 5);
  const urls = firstFive.map(doc => 'https://sonic.staging.jet-internal.com/docs/' + doc.relativePath);
  
  const results = await checkAllUrls(urls);
  
  console.log('\nResults:');
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.success ? '✓' : '✗'} ${result.url} (${result.status || result.error})`);
  });
}

/**
 * Show statistics about the documents
 */
function showDocumentStats() {
  console.log('\nDocument Statistics:\n');
  
  const documents = loadDocuments();
  console.log(`Total documents: ${documents.length}`);
  
  // Group by owner
  const ownerGroups = {};
  documents.forEach(doc => {
    ownerGroups[doc.owner] = (ownerGroups[doc.owner] || 0) + 1;
  });
  
  console.log('\nDocuments by owner:');
  Object.entries(ownerGroups)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10) // Top 10
    .forEach(([owner, count]) => {
      console.log(`  ${owner}: ${count} documents`);
    });
  
  // Group by file extension
  const extensions = {};
  documents.forEach(doc => {
    const ext = doc.relativePath.split('.').pop();
    extensions[ext] = (extensions[ext] || 0) + 1;
  });
  
  console.log('\nDocuments by file type:');
  Object.entries(extensions)
    .sort(([, a], [, b]) => b - a)
    .forEach(([ext, count]) => {
      console.log(`  .${ext}: ${count} documents`);
    });
}

// Main execution
async function main() {
  console.log('=== Dead Link Checker Test Suite ===\n');
  
  try {
    showDocumentStats();
    await testSingleUrl();
    await testFirstFiveUrls();
    
    console.log('\n=== Test completed ===');
    console.log('\nTo run the full dead link check, use:');
    console.log('  node deadlink-checker.js');
    
  } catch (error) {
    console.error('Test failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}