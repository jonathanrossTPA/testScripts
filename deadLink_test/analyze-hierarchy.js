/**
 * Hierarchy Analyzer for Documents.json
 * 
 * This script analyzes the JSON structure to find "concept" or "component"
 * strings at the top of any hierarchy in the Documents.json file.
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
function loadJSONFile() {
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
 * Recursively analyze hierarchy and find concept/component references
 * @param {Array} items - Menu items to analyze
 * @param {number} level - Current hierarchy level
 * @param {string} parentPath - Parent path for context
 * @returns {Array} Analysis results
 */
function analyzeHierarchy(items, level = 0, parentPath = '') {
  let results = [];
  
  items.forEach((item, index) => {
    if (item.name) {
      const fullPath = parentPath ? `${parentPath} > ${item.name}` : item.name;
      const indent = '  '.repeat(level);
      
      // Check if name contains concept or component (case insensitive)
      const containsConcept = item.name.toLowerCase().includes('concept');
      const containsComponent = item.name.toLowerCase().includes('component');
      const pathContainsConcept = item.path && item.path.toLowerCase().includes('concept');
      const pathContainsComponent = item.path && item.path.toLowerCase().includes('component');
      
      const analysisItem = {
        name: item.name,
        path: item.path || 'No path',
        level: level,
        index: index,
        fullPath: fullPath,
        indent: indent,
        hasChildren: item.children && item.children.length > 0,
        isClickable: item.isClickable,
        containsConcept: containsConcept,
        containsComponent: containsComponent,
        pathContainsConcept: pathContainsConcept,
        pathContainsComponent: pathContainsComponent,
        isTopLevel: level === 0,
        childrenCount: item.children ? item.children.length : 0
      };
      
      results.push(analysisItem);
      
      // Recursively analyze children
      if (item.children && item.children.length > 0) {
        const childResults = analyzeHierarchy(item.children, level + 1, fullPath);
        results = results.concat(childResults);
      }
    }
  });
  
  return results;
}

/**
 * Display analysis results
 * @param {Array} results - Analysis results
 */
function displayResults(results) {
  console.log(`${colors.bold}=== HIERARCHY ANALYSIS FOR CONCEPT/COMPONENT ===${colors.reset}`);
  console.log(`${colors.cyan}File: ${JSON_FILE_PATH}${colors.reset}`);
  console.log(`${colors.cyan}Analysis Date: ${new Date().toISOString()}${colors.reset}\n`);
  
  // Top-level items
  const topLevelItems = results.filter(item => item.isTopLevel);
  console.log(`${colors.blue}${colors.bold}TOP-LEVEL HIERARCHY ITEMS:${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(40)}${colors.reset}`);
  
  topLevelItems.forEach((item, index) => {
    const conceptFlag = item.containsConcept ? ' [CONCEPT NAME]' : '';
    const componentFlag = item.containsComponent ? ' [COMPONENT NAME]' : '';
    const pathConceptFlag = item.pathContainsConcept ? ' [CONCEPT PATH]' : '';
    const pathComponentFlag = item.pathContainsComponent ? ' [COMPONENT PATH]' : '';
    
    console.log(`${index + 1}. "${item.name}"${conceptFlag}${componentFlag}${pathConceptFlag}${pathComponentFlag}`);
    console.log(`   Path: ${item.path}`);
    console.log(`   Children: ${item.childrenCount}`);
    console.log(`   Clickable: ${item.isClickable}`);
    console.log('');
  });
  
  // Items with concept in name
  const conceptNameItems = results.filter(item => item.containsConcept);
  if (conceptNameItems.length > 0) {
    console.log(`${colors.yellow}${colors.bold}ITEMS WITH "CONCEPT" IN NAME (${conceptNameItems.length}):${colors.reset}`);
    console.log(`${colors.yellow}${'='.repeat(50)}${colors.reset}`);
    
    conceptNameItems.forEach((item, index) => {
      console.log(`${index + 1}. Level ${item.level}: "${item.name}"`);
      console.log(`   Path: ${item.path}`);
      console.log(`   Full Context: ${item.fullPath}`);
      console.log('');
    });
  }
  
  // Items with component in name
  const componentNameItems = results.filter(item => item.containsComponent);
  if (componentNameItems.length > 0) {
    console.log(`${colors.green}${colors.bold}ITEMS WITH "COMPONENT" IN NAME (${componentNameItems.length}):${colors.reset}`);
    console.log(`${colors.green}${'='.repeat(50)}${colors.reset}`);
    
    componentNameItems.forEach((item, index) => {
      console.log(`${index + 1}. Level ${item.level}: "${item.name}"`);
      console.log(`   Path: ${item.path}`);
      console.log(`   Full Context: ${item.fullPath}`);
      console.log('');
    });
  } else {
    console.log(`${colors.green}${colors.bold}NO ITEMS WITH "COMPONENT" IN NAME FOUND${colors.reset}\n`);
  }
  
  // Items with concept in path
  const conceptPathItems = results.filter(item => item.pathContainsConcept && !item.containsConcept);
  if (conceptPathItems.length > 0) {
    console.log(`${colors.cyan}${colors.bold}ITEMS WITH "CONCEPT" IN PATH ONLY (${conceptPathItems.length}):${colors.reset}`);
    console.log(`${colors.cyan}${'='.repeat(50)}${colors.reset}`);
    
    conceptPathItems.slice(0, 10).forEach((item, index) => {
      console.log(`${index + 1}. Level ${item.level}: "${item.name}"`);
      console.log(`   Path: ${item.path}`);
      console.log('');
    });
    
    if (conceptPathItems.length > 10) {
      console.log(`   ... and ${conceptPathItems.length - 10} more items with concept in path`);
    }
  }
  
  // Items with component in path
  const componentPathItems = results.filter(item => item.pathContainsComponent && !item.containsComponent);
  if (componentPathItems.length > 0) {
    console.log(`${colors.magenta}${colors.bold}ITEMS WITH "COMPONENT" IN PATH ONLY (${componentPathItems.length}):${colors.reset}`);
    console.log(`${colors.magenta}${'='.repeat(50)}${colors.reset}`);
    
    componentPathItems.slice(0, 10).forEach((item, index) => {
      console.log(`${index + 1}. Level ${item.level}: "${item.name}"`);
      console.log(`   Path: ${item.path}`);
      console.log('');
    });
    
    if (componentPathItems.length > 10) {
      console.log(`   ... and ${componentPathItems.length - 10} more items with component in path`);
    }
  } else {
    console.log(`${colors.magenta}${colors.bold}NO ITEMS WITH "COMPONENT" IN PATH FOUND${colors.reset}\n`);
  }
  
  // Summary statistics
  console.log(`${colors.bold}SUMMARY:${colors.reset}`);
  console.log(`  Total items analyzed: ${results.length}`);
  console.log(`  Top-level items: ${topLevelItems.length}`);
  console.log(`  Items with "concept" in name: ${conceptNameItems.length}`);
  console.log(`  Items with "component" in name: ${componentNameItems.length}`);
  console.log(`  Items with "concept" in path: ${results.filter(item => item.pathContainsConcept).length}`);
  console.log(`  Items with "component" in path: ${results.filter(item => item.pathContainsComponent).length}`);
}

/**
 * Check for hierarchy patterns
 * @param {Array} results - Analysis results
 */
function analyzeHierarchyPatterns(results) {
  console.log(`\n${colors.bold}=== HIERARCHY PATTERNS ANALYSIS ===${colors.reset}`);
  
  // Group by level
  const levelGroups = {};
  results.forEach(item => {
    if (!levelGroups[item.level]) {
      levelGroups[item.level] = [];
    }
    levelGroups[item.level].push(item);
  });
  
  console.log(`${colors.blue}Items by hierarchy level:${colors.reset}`);
  Object.keys(levelGroups).sort().forEach(level => {
    const items = levelGroups[level];
    const conceptCount = items.filter(item => item.containsConcept || item.pathContainsConcept).length;
    const componentCount = items.filter(item => item.containsComponent || item.pathContainsComponent).length;
    
    console.log(`  Level ${level}: ${items.length} items (concept: ${conceptCount}, component: ${componentCount})`);
  });
  
  // Check if there are any hierarchy patterns starting with concept/component
  const topLevelConcepts = results.filter(item => item.isTopLevel && (item.containsConcept || item.pathContainsConcept));
  const topLevelComponents = results.filter(item => item.isTopLevel && (item.containsComponent || item.pathContainsComponent));
  
  if (topLevelConcepts.length > 0) {
    console.log(`\n${colors.yellow}Top-level hierarchies starting with concept: ${topLevelConcepts.length}${colors.reset}`);
    topLevelConcepts.forEach(item => {
      console.log(`  - "${item.name}" (${item.childrenCount} children)`);
    });
  }
  
  if (topLevelComponents.length > 0) {
    console.log(`\n${colors.green}Top-level hierarchies starting with component: ${topLevelComponents.length}${colors.reset}`);
    topLevelComponents.forEach(item => {
      console.log(`  - "${item.name}" (${item.childrenCount} children)`);
    });
  }
}

/**
 * Main function
 */
function main() {
  console.log(`${colors.bold}Hierarchy Analyzer for Documents.json${colors.reset}`);
  console.log(`${colors.bold}====================================${colors.reset}\n`);
  
  // Load JSON data
  const jsonData = loadJSONFile();
  
  if (!jsonData.menuItems || !Array.isArray(jsonData.menuItems)) {
    console.error(`${colors.red}Error: JSON file does not contain a 'menuItems' array${colors.reset}`);
    process.exit(1);
  }
  
  // Analyze hierarchy
  const results = analyzeHierarchy(jsonData.menuItems);
  
  // Display results
  displayResults(results);
  
  // Analyze patterns
  analyzeHierarchyPatterns(results);
  
  console.log(`\n${colors.bold}Analysis completed.${colors.reset}`);
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

module.exports = { analyzeHierarchy, loadJSONFile };