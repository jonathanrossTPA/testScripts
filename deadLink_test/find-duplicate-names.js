/**
 * Duplicate Name Finder for Documents.json
 * 
 * This script searches for duplicates in the top-level "name" parameter
 * in the menuItems array of the Documents.json file.
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
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

/**
 * Load and parse the JSON file
 * @returns {Object} Parsed JSON data
 */
function loadDocuments() {
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
 * Find duplicates in top-level menuItems names
 * @param {Array} menuItems - Array of menu items
 * @returns {Object} Object containing duplicate analysis
 */
function findDuplicateNames(menuItems) {
  const nameCount = {};
  const nameIndices = {};
  
  // Count occurrences of each name and track their indices
  menuItems.forEach((item, index) => {
    const name = item.name;
    if (name) {
      if (nameCount[name]) {
        nameCount[name]++;
        nameIndices[name].push(index);
      } else {
        nameCount[name] = 1;
        nameIndices[name] = [index];
      }
    }
  });
  
  // Find duplicates
  const duplicates = {};
  const uniqueNames = [];
  
  for (const [name, count] of Object.entries(nameCount)) {
    if (count > 1) {
      duplicates[name] = {
        count: count,
        indices: nameIndices[name],
        items: nameIndices[name].map(index => menuItems[index])
      };
    } else {
      uniqueNames.push(name);
    }
  }
  
  return {
    duplicates,
    uniqueNames,
    totalItems: menuItems.length,
    totalUniqueNames: Object.keys(nameCount).length,
    duplicateCount: Object.keys(duplicates).length
  };
}

/**
 * Recursively find all names at any level (for additional analysis)
 * @param {Array} menuItems - Array of menu items
 * @param {number} level - Current depth level
 * @returns {Array} Array of name objects with metadata
 */
function getAllNamesRecursively(menuItems, level = 0, parentPath = '') {
  let allNames = [];
  
  menuItems.forEach((item, index) => {
    if (item.name) {
      const fullPath = parentPath ? `${parentPath} > ${item.name}` : item.name;
      allNames.push({
        name: item.name,
        level: level,
        index: index,
        path: item.path || '#',
        fullPath: fullPath,
        hasChildren: item.children && item.children.length > 0,
        isClickable: item.isClickable
      });
      
      // Recursively process children
      if (item.children && item.children.length > 0) {
        const childNames = getAllNamesRecursively(item.children, level + 1, fullPath);
        allNames = allNames.concat(childNames);
      }
    }
  });
  
  return allNames;
}

/**
 * Display duplicate analysis results
 * @param {Object} analysis - Analysis results
 */
function displayResults(analysis) {
  console.log(`${colors.bold}=== DUPLICATE NAME ANALYSIS ===${colors.reset}`);
  console.log(`${colors.cyan}JSON File: ${JSON_FILE_PATH}${colors.reset}`);
  console.log(`${colors.cyan}Analysis Date: ${new Date().toISOString()}${colors.reset}\n`);
  
  console.log(`${colors.blue}Summary:${colors.reset}`);
  console.log(`  Total top-level menu items: ${analysis.totalItems}`);
  console.log(`  Total unique names: ${analysis.totalUniqueNames}`);
  console.log(`  Names with duplicates: ${analysis.duplicateCount}`);
  console.log(`  Names without duplicates: ${analysis.uniqueNames.length}\n`);
  
  if (analysis.duplicateCount > 0) {
    console.log(`${colors.red}${colors.bold}DUPLICATE NAMES FOUND:${colors.reset}`);
    console.log(`${colors.red}=====================${colors.reset}\n`);
    
    Object.entries(analysis.duplicates).forEach(([name, data], index) => {
      console.log(`${colors.yellow}${index + 1}. "${name}"${colors.reset}`);
      console.log(`   ${colors.red}Appears ${data.count} times at indices: [${data.indices.join(', ')}]${colors.reset}`);
      
      data.items.forEach((item, itemIndex) => {
        console.log(`   ${colors.cyan}${itemIndex + 1}. Path: ${item.path || 'No path'}${colors.reset}`);
        console.log(`      ${colors.cyan}Has children: ${item.children ? item.children.length : 0}${colors.reset}`);
        console.log(`      ${colors.cyan}Is clickable: ${item.isClickable !== undefined ? item.isClickable : 'undefined'}${colors.reset}`);
      });
      console.log('');
    });
    
    // Write duplicates to file
    const duplicateReport = {
      analysisDate: new Date().toISOString(),
      summary: {
        totalItems: analysis.totalItems,
        totalUniqueNames: analysis.totalUniqueNames,
        duplicateCount: analysis.duplicateCount
      },
      duplicates: analysis.duplicates
    };
    
    fs.writeFileSync('duplicate-names-report.json', JSON.stringify(duplicateReport, null, 2));
    console.log(`${colors.green}Detailed duplicate report saved to 'duplicate-names-report.json'${colors.reset}\n`);
    
  } else {
    console.log(`${colors.green}${colors.bold}🎉 No duplicate names found at the top level!${colors.reset}\n`);
  }
  
  // Show some sample unique names
  if (analysis.uniqueNames.length > 0) {
    console.log(`${colors.blue}Sample unique names (first 10):${colors.reset}`);
    analysis.uniqueNames.slice(0, 10).forEach((name, index) => {
      console.log(`  ${index + 1}. "${name}"`);
    });
    if (analysis.uniqueNames.length > 10) {
      console.log(`  ... and ${analysis.uniqueNames.length - 10} more unique names`);
    }
  }
}

/**
 * Additional analysis: Check for duplicates at all levels
 * @param {Object} jsonData - The full JSON data
 */
function analyzeAllLevels(jsonData) {
  console.log(`\n${colors.bold}=== ADDITIONAL ANALYSIS: ALL LEVELS ===${colors.reset}`);
  
  const allNames = getAllNamesRecursively(jsonData.menuItems);
  const nameCountAll = {};
  
  allNames.forEach(item => {
    const name = item.name;
    if (nameCountAll[name]) {
      nameCountAll[name].count++;
      nameCountAll[name].locations.push({
        level: item.level,
        fullPath: item.fullPath,
        path: item.path
      });
    } else {
      nameCountAll[name] = {
        count: 1,
        locations: [{
          level: item.level,
          fullPath: item.fullPath,
          path: item.path
        }]
      };
    }
  });
  
  const allLevelDuplicates = Object.entries(nameCountAll).filter(([name, data]) => data.count > 1);
  
  console.log(`Total names across all levels: ${allNames.length}`);
  console.log(`Unique names across all levels: ${Object.keys(nameCountAll).length}`);
  console.log(`Names with duplicates across all levels: ${allLevelDuplicates.length}\n`);
  
  if (allLevelDuplicates.length > 0) {
    console.log(`${colors.yellow}Duplicates across all levels (showing first 5):${colors.reset}`);
    allLevelDuplicates.slice(0, 5).forEach(([name, data], index) => {
      console.log(`${index + 1}. "${name}" (${data.count} occurrences):`);
      data.locations.forEach((location, locIndex) => {
        console.log(`   ${locIndex + 1}. Level ${location.level}: ${location.fullPath}`);
      });
      console.log('');
    });
    
    if (allLevelDuplicates.length > 5) {
      console.log(`   ... and ${allLevelDuplicates.length - 5} more duplicate names across all levels`);
    }
  }
}

/**
 * Main function
 */
function main() {
  console.log(`${colors.bold}Duplicate Name Finder for Documents.json${colors.reset}`);
  console.log(`${colors.bold}==========================================${colors.reset}\n`);
  
  // Load the JSON data
  const jsonData = loadDocuments();
  
  if (!jsonData.menuItems || !Array.isArray(jsonData.menuItems)) {
    console.error(`${colors.red}Error: JSON file does not contain a 'menuItems' array${colors.reset}`);
    process.exit(1);
  }
  
  // Analyze top-level duplicates
  const analysis = findDuplicateNames(jsonData.menuItems);
  displayResults(analysis);
  
  // Additional analysis for all levels
  analyzeAllLevels(jsonData);
  
  console.log(`\n${colors.bold}Analysis completed.${colors.reset}`);
  
  // Exit with error code if duplicates found
  if (analysis.duplicateCount > 0) {
    process.exit(1);
  }
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

module.exports = { findDuplicateNames, getAllNamesRecursively, loadDocuments };