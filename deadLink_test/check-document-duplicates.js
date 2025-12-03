/**
 * Document Names Duplicate Checker
 * 
 * This script checks for duplicates in the document-names-list.txt file,
 * ignoring the numbering (e.g., "1. ", "2. ", etc.) at the start of each row.
 */

const fs = require('fs');
const path = require('path');

const LIST_FILE_PATH = path.join(__dirname, 'document-names-list.txt');

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
 * Load and parse the document names list
 * @returns {Array} Array of document name objects
 */
function loadDocumentNamesList() {
  try {
    const data = fs.readFileSync(LIST_FILE_PATH, 'utf8');
    const lines = data.split('\n').filter(line => line.trim() !== '');
    
    return lines.map((line, index) => {
      // Remove the numbering at the start (e.g., "123. " becomes "")
      const cleanName = line.replace(/^\d+\.\s+/, '').trim();
      return {
        originalLine: line,
        cleanName: cleanName,
        lineNumber: index + 1
      };
    });
  } catch (error) {
    console.error(`${colors.red}Error reading document names list: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

/**
 * Find duplicates in the clean document names
 * @param {Array} documentItems - Array of document objects
 * @returns {Object} Analysis results
 */
function findDuplicates(documentItems) {
  const nameCount = {};
  const nameOccurrences = {};
  
  // Count occurrences and track line numbers
  documentItems.forEach(item => {
    const name = item.cleanName;
    if (name) {
      if (nameCount[name]) {
        nameCount[name]++;
        nameOccurrences[name].push(item);
      } else {
        nameCount[name] = 1;
        nameOccurrences[name] = [item];
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
        occurrences: nameOccurrences[name]
      };
    } else {
      uniqueNames.push(name);
    }
  }
  
  return {
    duplicates,
    uniqueNames,
    totalItems: documentItems.length,
    totalUniqueNames: Object.keys(nameCount).length,
    duplicateCount: Object.keys(duplicates).length,
    duplicateInstanceCount: Object.values(duplicates).reduce((sum, dup) => sum + dup.count, 0)
  };
}

/**
 * Display duplicate analysis results
 * @param {Object} analysis - Analysis results
 */
function displayResults(analysis) {
  console.log(`${colors.bold}=== DOCUMENT NAMES DUPLICATE ANALYSIS ===${colors.reset}`);
  console.log(`${colors.cyan}File: ${LIST_FILE_PATH}${colors.reset}`);
  console.log(`${colors.cyan}Analysis Date: ${new Date().toISOString()}${colors.reset}\n`);
  
  console.log(`${colors.blue}${colors.bold}SUMMARY:${colors.reset}`);
  console.log(`  Total document entries: ${analysis.totalItems}`);
  console.log(`  Unique document names: ${analysis.totalUniqueNames}`);
  console.log(`  Names with duplicates: ${analysis.duplicateCount}`);
  console.log(`  Total duplicate instances: ${analysis.duplicateInstanceCount - analysis.duplicateCount}`);
  console.log(`  Names without duplicates: ${analysis.uniqueNames.length}\n`);
  
  if (analysis.duplicateCount > 0) {
    console.log(`${colors.red}${colors.bold}DUPLICATE DOCUMENT NAMES FOUND:${colors.reset}`);
    console.log(`${colors.red}${'='.repeat(50)}${colors.reset}\n`);
    
    // Sort duplicates by count (highest first)
    const sortedDuplicates = Object.entries(analysis.duplicates)
      .sort(([, a], [, b]) => b.count - a.count);
    
    sortedDuplicates.forEach(([name, data], index) => {
      console.log(`${colors.yellow}${index + 1}. "${name}"${colors.reset}`);
      console.log(`   ${colors.red}Appears ${data.count} times:${colors.reset}`);
      
      data.occurrences.forEach((occurrence, occIndex) => {
        console.log(`   ${colors.cyan}${occIndex + 1}. Line ${occurrence.lineNumber}: ${occurrence.originalLine}${colors.reset}`);
      });
      console.log('');
    });
    
    // Group duplicates by frequency
    console.log(`${colors.magenta}${colors.bold}DUPLICATES BY FREQUENCY:${colors.reset}`);
    console.log(`${colors.magenta}${'='.repeat(30)}${colors.reset}`);
    
    const frequencyGroups = {};
    Object.values(analysis.duplicates).forEach(dup => {
      const count = dup.count;
      if (!frequencyGroups[count]) {
        frequencyGroups[count] = [];
      }
      frequencyGroups[count].push(dup.occurrences[0].cleanName);
    });
    
    Object.keys(frequencyGroups)
      .sort((a, b) => parseInt(b) - parseInt(a))
      .forEach(count => {
        const names = frequencyGroups[count];
        console.log(`\n${colors.magenta}Names appearing ${count} times: ${names.length}${colors.reset}`);
        names.forEach(name => {
          console.log(`  - "${name}"`);
        });
      });
    
    // Save detailed report
    const duplicateReport = {
      metadata: {
        analysisDate: new Date().toISOString(),
        sourceFile: LIST_FILE_PATH,
        summary: {
          totalItems: analysis.totalItems,
          uniqueNames: analysis.totalUniqueNames,
          duplicateCount: analysis.duplicateCount,
          duplicateInstances: analysis.duplicateInstanceCount - analysis.duplicateCount
        }
      },
      duplicates: Object.entries(analysis.duplicates).map(([name, data]) => ({
        name: name,
        count: data.count,
        occurrences: data.occurrences.map(occ => ({
          lineNumber: occ.lineNumber,
          originalLine: occ.originalLine
        }))
      }))
    };
    
    fs.writeFileSync('document-names-duplicates-report.json', JSON.stringify(duplicateReport, null, 2));
    console.log(`\n${colors.green}Detailed duplicate report saved to 'document-names-duplicates-report.json'${colors.reset}`);
    
  } else {
    console.log(`${colors.green}${colors.bold}🎉 No duplicate document names found!${colors.reset}`);
    console.log(`${colors.green}All ${analysis.totalItems} document names are unique.${colors.reset}`);
  }
  
  // Show sample unique names
  if (analysis.uniqueNames.length > 0) {
    console.log(`\n${colors.blue}${colors.bold}SAMPLE UNIQUE NAMES (first 10):${colors.reset}`);
    analysis.uniqueNames.slice(0, 10).forEach((name, index) => {
      console.log(`  ${index + 1}. "${name}"`);
    });
    if (analysis.uniqueNames.length > 10) {
      console.log(`  ... and ${analysis.uniqueNames.length - 10} more unique names`);
    }
  }
}

/**
 * Additional analysis: Find near-duplicates (similar names)
 * @param {Array} documentItems - Array of document objects
 */
function findSimilarNames(documentItems) {
  console.log(`\n${colors.cyan}${colors.bold}=== SIMILAR NAMES ANALYSIS ===${colors.reset}`);
  
  const names = documentItems.map(item => item.cleanName);
  const similarGroups = [];
  
  // Simple similarity check based on common patterns
  const patterns = [
    /^(.+)\s+(docs?|documentation)$/i,
    /^(.+)\s+(api|service)$/i,
    /^(.+)\s+(worker|processor)$/i,
    /^(.+)\s+(guide|tutorial)$/i,
    /^(.+)\s+(overview|introduction)$/i
  ];
  
  patterns.forEach(pattern => {
    const matches = {};
    names.forEach((name, index) => {
      const match = name.match(pattern);
      if (match) {
        const baseName = match[1].toLowerCase();
        if (!matches[baseName]) {
          matches[baseName] = [];
        }
        matches[baseName].push({
          name: name,
          lineNumber: documentItems[index].lineNumber
        });
      }
    });
    
    // Find groups with multiple matches
    Object.entries(matches).forEach(([base, items]) => {
      if (items.length > 1) {
        similarGroups.push({
          pattern: pattern.toString(),
          baseName: base,
          matches: items
        });
      }
    });
  });
  
  if (similarGroups.length > 0) {
    console.log(`${colors.yellow}Found ${similarGroups.length} groups of similar names:${colors.reset}\n`);
    
    similarGroups.slice(0, 5).forEach((group, index) => {
      console.log(`${colors.yellow}${index + 1}. Similar to "${group.baseName}" (${group.matches.length} matches):${colors.reset}`);
      group.matches.forEach(match => {
        console.log(`   Line ${match.lineNumber}: "${match.name}"`);
      });
      console.log('');
    });
    
    if (similarGroups.length > 5) {
      console.log(`   ... and ${similarGroups.length - 5} more groups of similar names`);
    }
  } else {
    console.log(`${colors.green}No obvious similar name patterns found.${colors.reset}`);
  }
}

/**
 * Main function
 */
function main() {
  console.log(`${colors.bold}Document Names Duplicate Checker${colors.reset}`);
  console.log(`${colors.bold}=================================${colors.reset}\n`);
  
  // Load document names
  const documentItems = loadDocumentNamesList();
  console.log(`Loaded ${documentItems.length} document names from the list.\n`);
  
  // Find duplicates
  const analysis = findDuplicates(documentItems);
  displayResults(analysis);
  
  // Find similar names
  findSimilarNames(documentItems);
  
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

module.exports = { loadDocumentNamesList, findDuplicates, findSimilarNames };