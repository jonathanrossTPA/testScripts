/**
 * Document Names Extractor for API Response
 * 
 * This script extracts all document names from the API response
 * GET https://sonicportalapi.pl-soft-change-sonic.pdv-5.eu-west-1.staging.jet-internal.com/static/docs/metadata/concept
 * and creates a comprehensive list of all documents.
 */

const fs = require('fs');
const path = require('path');

const JSON_FILE_PATH = path.join(__dirname, 'Downloads', 'Documents.json');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

/**
 * Load and parse the JSON file
 * @returns {Object} Parsed JSON data
 */
function loadAPIResponse() {
  try {
    const data = fs.readFileSync(JSON_FILE_PATH, 'utf8');
    const parsed = JSON.parse(data);
    return parsed;
  } catch (error) {
    console.error(`${colors.red}Error reading JSON file: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

/**
 * Recursively extract all document names with their metadata
 * @param {Array} menuItems - Array of menu items
 * @param {number} level - Current depth level
 * @param {string} parentPath - Parent path for context
 * @returns {Array} Array of document objects
 */
function extractAllDocuments(menuItems, level = 0, parentPath = '') {
  let documents = [];
  
  menuItems.forEach((item, index) => {
    if (item.name) {
      const fullPath = parentPath ? `${parentPath} > ${item.name}` : item.name;
      const indent = '  '.repeat(level);
      
      // Determine if this is a document or a category
      const isDocument = item.isClickable && item.path && item.path !== '#' && item.path.includes('.html');
      const isCategory = !item.isClickable || item.path === '#';
      
      documents.push({
        name: item.name,
        level: level,
        index: index,
        path: item.path || 'No path',
        fullPath: fullPath,
        hasChildren: item.children && item.children.length > 0,
        isClickable: item.isClickable,
        isDocument: isDocument,
        isCategory: isCategory,
        indent: indent,
        type: isDocument ? 'Document' : (isCategory ? 'Category' : 'Unknown')
      });
      
      // Recursively process children
      if (item.children && item.children.length > 0) {
        const childDocuments = extractAllDocuments(item.children, level + 1, fullPath);
        documents = documents.concat(childDocuments);
      }
    }
  });
  
  return documents;
}

/**
 * Generate different views of the document list
 * @param {Array} documents - Array of all documents
 */
function generateDocumentLists(documents) {
  const allDocuments = documents.filter(doc => doc.isDocument);
  const categories = documents.filter(doc => doc.isCategory);
  const allItems = documents;
  
  console.log(`${colors.bold}=== API RESPONSE DOCUMENT ANALYSIS ===${colors.reset}`);
  console.log(`${colors.cyan}API Endpoint: GET https://sonicportalapi.pl-soft-change-sonic.pdv-5.eu-west-1.staging.jet-internal.com/static/docs/metadata/concept${colors.reset}`);
  console.log(`${colors.cyan}Analysis Date: ${new Date().toISOString()}${colors.reset}\n`);
  
  // Summary
  console.log(`${colors.blue}${colors.bold}SUMMARY:${colors.reset}`);
  console.log(`  Total items: ${allItems.length}`);
  console.log(`  Documents (clickable with .html): ${allDocuments.length}`);
  console.log(`  Categories/Folders: ${categories.length}\n`);
  
  // 1. All Document Names (flat list)
  console.log(`${colors.green}${colors.bold}1. ALL DOCUMENT NAMES (${allDocuments.length} documents):${colors.reset}`);
  console.log(`${colors.green}${'='.repeat(50)}${colors.reset}`);
  allDocuments.forEach((doc, index) => {
    console.log(`${index + 1}. ${doc.name}`);
  });
  
  // 2. Hierarchical Document Structure
  console.log(`\n${colors.yellow}${colors.bold}2. HIERARCHICAL DOCUMENT STRUCTURE:${colors.reset}`);
  console.log(`${colors.yellow}${'='.repeat(50)}${colors.reset}`);
  allItems.forEach((item) => {
    const icon = item.isDocument ? '📄' : '📁';
    const typeLabel = item.isDocument ? '[DOC]' : '[CAT]';
    console.log(`${item.indent}${icon} ${typeLabel} ${item.name}`);
  });
  
  // 3. Documents Only with Paths
  console.log(`\n${colors.magenta}${colors.bold}3. DOCUMENTS WITH PATHS:${colors.reset}`);
  console.log(`${colors.magenta}${'='.repeat(50)}${colors.reset}`);
  allDocuments.forEach((doc, index) => {
    console.log(`${index + 1}. ${doc.name}`);
    console.log(`   Path: ${doc.path}`);
    console.log(`   Full Context: ${doc.fullPath}`);
    console.log('');
  });
  
  // 4. Documents grouped by depth level
  console.log(`${colors.cyan}${colors.bold}4. DOCUMENTS BY LEVEL:${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(50)}${colors.reset}`);
  const documentsByLevel = {};
  allDocuments.forEach(doc => {
    if (!documentsByLevel[doc.level]) {
      documentsByLevel[doc.level] = [];
    }
    documentsByLevel[doc.level].push(doc);
  });
  
  Object.keys(documentsByLevel).sort().forEach(level => {
    const docs = documentsByLevel[level];
    console.log(`\n${colors.cyan}Level ${level} (${docs.length} documents):${colors.reset}`);
    docs.forEach((doc, index) => {
      console.log(`  ${index + 1}. ${doc.name}`);
    });
  });
  
  return { allDocuments, categories, allItems };
}

/**
 * Export lists to files
 * @param {Object} data - Object containing document arrays
 */
function exportToFiles(data) {
  const { allDocuments, categories, allItems } = data;
  
  // Export simple document names list
  const documentNames = allDocuments.map((doc, index) => `${index + 1}. ${doc.name}`).join('\n');
  fs.writeFileSync('document-names-list.txt', documentNames);
  
  // Export detailed document info as JSON
  const detailedReport = {
    metadata: {
      apiEndpoint: 'GET https://sonicportalapi.pl-soft-change-sonic.pdv-5.eu-west-1.staging.jet-internal.com/static/docs/metadata/concept',
      extractionDate: new Date().toISOString(),
      summary: {
        totalItems: allItems.length,
        documentCount: allDocuments.length,
        categoryCount: categories.length
      }
    },
    documents: allDocuments.map(doc => ({
      name: doc.name,
      path: doc.path,
      fullContext: doc.fullPath,
      level: doc.level
    })),
    categories: categories.map(cat => ({
      name: cat.name,
      path: cat.path,
      fullContext: cat.fullPath,
      level: cat.level,
      hasChildren: cat.hasChildren
    }))
  };
  
  fs.writeFileSync('detailed-document-report.json', JSON.stringify(detailedReport, null, 2));
  
  // Export hierarchical structure
  const hierarchicalList = allItems.map(item => {
    const icon = item.isDocument ? '📄' : '📁';
    const typeLabel = item.isDocument ? '[DOC]' : '[CAT]';
    return `${item.indent}${icon} ${typeLabel} ${item.name}`;
  }).join('\n');
  
  fs.writeFileSync('hierarchical-structure.txt', hierarchicalList);
  
  console.log(`\n${colors.green}${colors.bold}FILES EXPORTED:${colors.reset}`);
  console.log(`${colors.green}✓ document-names-list.txt - Simple list of document names${colors.reset}`);
  console.log(`${colors.green}✓ detailed-document-report.json - Complete analysis in JSON format${colors.reset}`);
  console.log(`${colors.green}✓ hierarchical-structure.txt - Hierarchical view of all items${colors.reset}`);
}

/**
 * Main function
 */
function main() {
  console.log(`${colors.bold}Document Names Extractor for API Response${colors.reset}`);
  console.log(`${colors.bold}===========================================${colors.reset}\n`);
  
  // Load the API response
  const apiResponse = loadAPIResponse();
  
  if (!apiResponse.menuItems || !Array.isArray(apiResponse.menuItems)) {
    console.error(`${colors.red}Error: API response does not contain a 'menuItems' array${colors.reset}`);
    process.exit(1);
  }
  
  // Extract all documents
  const allDocuments = extractAllDocuments(apiResponse.menuItems);
  
  // Generate different views
  const data = generateDocumentLists(allDocuments);
  
  // Export to files
  exportToFiles(data);
  
  console.log(`\n${colors.bold}Document extraction completed successfully!${colors.reset}`);
}

// Handle errors
process.on('uncaughtException', (error) => {
  console.error(`${colors.red}Uncaught Exception: ${error.message}${colors.reset}`);
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main();
}

module.exports = { extractAllDocuments, loadAPIResponse };