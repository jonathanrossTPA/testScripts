const fs = require('fs');

// Read the analysis template
const repos = JSON.parse(fs.readFileSync('./repoAnalysisTemplate.json', 'utf8'));

console.log('Generating current status table...\n');

// Create CSV with current data
const csvRows = [];

// Header
csvRows.push([
    'Component Name',
    'Repository URL',
    'Owner Team',
    'Organization',
    'Repository Name',
    'Languages (Pending Analysis)',
    'Has Helmfile.d (Pending)',
    'Is Monorepo (Pending)'
].join(','));

// Data rows
repos.forEach(repo => {
    csvRows.push([
        `"${repo.component}"`,
        `"${repo.repo}"`,
        `"${repo.owner}"`,
        `"${repo.org}"`,
        `"${repo.repoName}"`,
        '"REQUIRES_API_ACCESS"',
        '"REQUIRES_API_ACCESS"',
        '"REQUIRES_API_ACCESS"'
    ].join(','));
});

const csvContent = csvRows.join('\n');
fs.writeFileSync('nonSonicRepos_CurrentStatus.csv', csvContent);

console.log('✓ CSV created: nonSonicRepos_CurrentStatus.csv');
console.log(`  Contains ${repos.length} repositories\n`);

// Create a summary markdown table with first 100 repos
const mdRows = [];

mdRows.push('# Non-Sonic Repositories - Current List\n');
mdRows.push(`**Total Repositories:** ${repos.length}\n`);
mdRows.push('**Status:** Repository list extracted. Language analysis, helmfile.d detection, and monorepo identification require GitHub API access.\n');
mdRows.push('## Repository List (First 100)\n');
mdRows.push('| # | Component | Repository URL | Organization | Owner Team |');
mdRows.push('|---|-----------|---------------|--------------|------------|');

repos.slice(0, 100).forEach((repo, idx) => {
    mdRows.push(
        `| ${idx + 1} | ${repo.component} | [Link](${repo.repo}) | ${repo.org} | ${repo.owner} |`
    );
});

if (repos.length > 100) {
    mdRows.push(`| ... | *${repos.length - 100} more repositories* | ... | ... | ... |`);
}

mdRows.push('\n## What This Analysis Needs\n');
mdRows.push('To complete the full analysis with languages, helmfile.d, and monorepo detection:\n');
mdRows.push('1. **GitHub Enterprise API Token** - Required to fetch repository details');
mdRows.push('2. **API Access** - Access to `github.je-labs.com/api/v3`');
mdRows.push('3. **Run Analysis Script** - Execute `node fetchRepoDetails.js`\n');
mdRows.push('## Instructions\n');
mdRows.push('```powershell');
mdRows.push('# Set your GitHub token');
mdRows.push('$env:GITHUB_TOKEN="your-personal-access-token"');
mdRows.push('');
mdRows.push('# Run the analysis');
mdRows.push('node fetchRepoDetails.js');
mdRows.push('');
mdRows.push('# Generate the final table');
mdRows.push('node generateRepoTable.js');
mdRows.push('```\n');

const mdContent = mdRows.join('\n');
fs.writeFileSync('nonSonicRepos_CurrentStatus.md', mdContent);

console.log('✓ Markdown created: nonSonicRepos_CurrentStatus.md');
console.log('  Shows first 100 repositories\n');

// Create a simple text report
const txtLines = [];
txtLines.push('NON-SONIC REPOSITORIES - ANALYSIS STATUS');
txtLines.push('=' .repeat(80));
txtLines.push('');
txtLines.push(`Total Repositories: ${repos.length}`);
txtLines.push(`Status: List extracted from componentsResponse.json`);
txtLines.push('');
txtLines.push('WHAT WE HAVE:');
txtLines.push('  ✓ Component names');
txtLines.push('  ✓ Repository URLs');
txtLines.push('  ✓ Organization/Team ownership');
txtLines.push('  ✓ Parsed org and repo names');
txtLines.push('');
txtLines.push('WHAT WE NEED (Requires GitHub API):');
txtLines.push('  ⏳ Programming languages for each repo');
txtLines.push('  ⏳ Presence of helmfile.d directory');
txtLines.push('  ⏳ Monorepo detection');
txtLines.push('');
txtLines.push('TOP 10 ORGANIZATIONS:');
txtLines.push('-' .repeat(80));

const orgCounts = {};
repos.forEach(r => {
    orgCounts[r.org] = (orgCounts[r.org] || 0) + 1;
});

Object.entries(orgCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([org, count], idx) => {
        txtLines.push(`${(idx + 1).toString().padStart(2)}. ${org.padEnd(40)} ${count.toString().padStart(4)} repos`);
    });

txtLines.push('');
txtLines.push('SAMPLE REPOSITORIES (First 30):');
txtLines.push('-' .repeat(80));

repos.slice(0, 30).forEach((repo, idx) => {
    txtLines.push(`${(idx + 1).toString().padStart(3)}. ${repo.component}`);
    txtLines.push(`     ${repo.repo}`);
});

txtLines.push('');
txtLines.push(`... and ${repos.length - 30} more repositories`);
txtLines.push('');
txtLines.push('FILES GENERATED:');
txtLines.push('  • nonSonicRepos_CurrentStatus.csv  - All repos in spreadsheet format');
txtLines.push('  • nonSonicRepos_CurrentStatus.md   - Markdown documentation');
txtLines.push('  • nonSonicRepoURLs.txt             - Plain list of URLs');
txtLines.push('  • repoAnalysisTemplate.json        - Structured data for API analysis');
txtLines.push('');

const txtContent = txtLines.join('\n');
fs.writeFileSync('nonSonicRepos_STATUS.txt', txtContent);

console.log('✓ Text report created: nonSonicRepos_STATUS.txt\n');

console.log('=' .repeat(80));
console.log('SUMMARY');
console.log('=' .repeat(80));
console.log(`Total non-Sonic repositories identified: ${repos.length}`);
console.log(`Unique organizations: ${Object.keys(orgCounts).length}`);
console.log('');
console.log('FILES CREATED:');
console.log('  ✓ nonSonicRepos_CurrentStatus.csv  - Spreadsheet with all repos');
console.log('  ✓ nonSonicRepos_CurrentStatus.md   - Markdown documentation');
console.log('  ✓ nonSonicRepos_STATUS.txt         - Plain text summary');
console.log('  ✓ nonSonicRepoURLs.txt             - List of URLs');
console.log('');
console.log('NEXT STEP:');
console.log('  To get languages, helmfile.d status, and monorepo detection:');
console.log('  1. Set GitHub token: $env:GITHUB_TOKEN="your-token"');
console.log('  2. Run: node fetchRepoDetails.js');
console.log('  3. Generate final table: node generateRepoTable.js');
console.log('=' .repeat(80));
console.log('');
