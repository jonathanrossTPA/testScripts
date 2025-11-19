const fs = require('fs');

// Read the analysis template
const repos = JSON.parse(fs.readFileSync('./repoAnalysisTemplate.json', 'utf8'));

console.log('=== NON-SONIC REPOSITORIES ANALYSIS ===\n');
console.log(`Total repositories to analyze: ${repos.length}\n`);

// Show sample of what we're analyzing
console.log('SAMPLE REPOSITORIES (First 25):\n');
console.log('Component'.padEnd(40) + ' | Repository URL');
console.log('-'.repeat(40) + '-+-' + '-'.repeat(70));

repos.slice(0, 25).forEach((repo, idx) => {
    const component = repo.component.substring(0, 38).padEnd(40);
    console.log(`${component} | ${repo.repo}`);
});

console.log(`\n... and ${repos.length - 25} more repositories\n`);

// Create a list of unique repos
const repoUrls = repos.map(r => r.repo);
fs.writeFileSync('nonSonicRepoURLs.txt', repoUrls.join('\n'));
console.log('✓ All repository URLs saved to: nonSonicRepoURLs.txt\n');

// Breakdown by organization
console.log('=== REPOSITORIES BY ORGANIZATION (Top 20) ===\n');
const orgCounts = {};
repos.forEach(r => {
    const org = r.org;
    orgCounts[org] = (orgCounts[org] || 0) + 1;
});

Object.entries(orgCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .forEach(([org, count], idx) => {
        console.log(`${(idx + 1).toString().padStart(2)}. ${org.padEnd(35)} ${count.toString().padStart(4)} repos`);
    });

console.log('\n');

// Instructions for analysis
console.log('=== NEXT STEPS TO COMPLETE ANALYSIS ===\n');
console.log('To fetch languages, helmfile.d presence, and monorepo detection:\n');
console.log('1. Set your GitHub Enterprise token:');
console.log('   PowerShell: $env:GITHUB_TOKEN="your-personal-access-token"\n');
console.log('2. Run the fetch script:');
console.log('   node fetchRepoDetails.js\n');
console.log('3. Generate the table:');
console.log('   node generateRepoTable.js\n');
console.log('This will create:');
console.log('  - repoAnalysisResults.json (complete data)');
console.log('  - nonSonicReposAnalysis.csv (spreadsheet format)');
console.log('  - nonSonicReposAnalysis.md (markdown table)\n');

// Create a summary JSON
const summary = {
    totalNonSonicRepos: repos.length,
    organizationCount: Object.keys(orgCounts).length,
    topOrganizations: Object.entries(orgCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([org, count]) => ({ org, count })),
    analysisNeeded: {
        languages: true,
        helmfileD: true,
        monorepoCheck: true
    },
    sampleRepos: repos.slice(0, 10).map(r => ({
        component: r.component,
        repo: r.repo,
        org: r.org,
        repoName: r.repoName
    }))
};

fs.writeFileSync('nonSonicReposSummary.json', JSON.stringify(summary, null, 2));
console.log('✓ Summary saved to: nonSonicReposSummary.json\n');

console.log('=== FILES CREATED ===\n');
console.log('✓ nonSonicRepoList.json        - List of all non-Sonic components and repos');
console.log('✓ repoAnalysisTemplate.json    - Template for analysis with org/repo parsed');
console.log('✓ nonSonicRepoURLs.txt         - Simple list of all repo URLs');
console.log('✓ nonSonicReposSummary.json    - Summary statistics');
console.log('\n');
