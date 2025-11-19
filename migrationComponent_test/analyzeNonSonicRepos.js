const fs = require('fs');

// Read the components data
const data = JSON.parse(fs.readFileSync('./componentsResponse.json', 'utf8'));

// Filter for non-Sonic components with repos
const nonSonicComponents = data.filter(c => c.isSonic === false && c.repo);

console.log(`Found ${nonSonicComponents.length} non-Sonic components with repos\n`);

// Extract unique repo URLs
const repoList = nonSonicComponents.map(c => ({
    component: c.name,
    repo: c.repo,
    owner: c.owner
}));

// Save the repo list
fs.writeFileSync('nonSonicRepoList.json', JSON.stringify(repoList, null, 2));
console.log(`Saved ${repoList.length} repos to nonSonicRepoList.json\n`);

// For GitHub API analysis, we'll need to make API calls
// This script prepares the data structure for manual or API-based analysis

// Create a structure for analysis results
const analysisTemplate = repoList.map(item => {
    // Extract org and repo from URL
    const urlParts = item.repo.replace('https://github.je-labs.com/', '').split('/');
    const org = urlParts[0];
    const repoName = urlParts[1];
    
    return {
        component: item.component,
        repo: item.repo,
        org: org,
        repoName: repoName,
        owner: item.owner,
        languages: 'PENDING',
        hasHelmfileD: 'PENDING',
        isMonorepo: 'PENDING'
    };
});

fs.writeFileSync('repoAnalysisTemplate.json', JSON.stringify(analysisTemplate, null, 2));
console.log('Created analysis template in repoAnalysisTemplate.json');

// Display first 10 repos
console.log('\nFirst 10 repos to analyze:');
console.log('================================================');
analysisTemplate.slice(0, 10).forEach((item, idx) => {
    console.log(`${idx + 1}. ${item.component}`);
    console.log(`   Repo: ${item.repo}`);
    console.log(`   Org/Repo: ${item.org}/${item.repoName}`);
    console.log('');
});

console.log(`\nTotal repos to analyze: ${analysisTemplate.length}`);
console.log('\nTo analyze these repos, you will need:');
console.log('1. GitHub Enterprise API access token');
console.log('2. API calls to fetch:');
console.log('   - Languages: GET /repos/{org}/{repo}/languages');
console.log('   - Contents: GET /repos/{org}/{repo}/contents to check for helmfile.d');
console.log('   - Monorepo indicators: Check for multiple package.json, lerna.json, nx.json, etc.');
