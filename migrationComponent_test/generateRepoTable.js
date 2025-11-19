const fs = require('fs');

// Check if results file exists
if (!fs.existsSync('./repoAnalysisResults.json')) {
    console.log('Error: repoAnalysisResults.json not found!');
    console.log('Please run fetchRepoDetails.js first to gather the data.');
    process.exit(1);
}

// Read the results
const results = JSON.parse(fs.readFileSync('./repoAnalysisResults.json', 'utf8'));

console.log(`Generating table from ${results.length} repository analysis results...\n`);

// Generate CSV
const csvRows = [];

// Header
csvRows.push([
    'Component',
    'Repo URL',
    'Owner',
    'Organization',
    'Repository Name',
    'Languages',
    'Has Helmfile.d',
    'Is Monorepo',
    'Monorepo Indicators',
    'Error'
].join(','));

// Data rows
results.forEach(repo => {
    const languages = repo.languages || 'Unknown';
    const hasHelmfileD = repo.hasHelmfileD === true ? 'Yes' : repo.hasHelmfileD === false ? 'No' : 'Unknown';
    const isMonorepo = repo.isMonorepo === true ? 'Yes' : repo.isMonorepo === false ? 'No' : 'Unknown';
    const indicators = (repo.monorepoIndicators || []).join('; ') || 'N/A';
    const error = repo.error || '';

    csvRows.push([
        `"${repo.component}"`,
        `"${repo.repo}"`,
        `"${repo.owner}"`,
        `"${repo.org}"`,
        `"${repo.repoName}"`,
        `"${languages}"`,
        hasHelmfileD,
        isMonorepo,
        `"${indicators}"`,
        `"${error}"`
    ].join(','));
});

const csvContent = csvRows.join('\n');
fs.writeFileSync('nonSonicReposAnalysis.csv', csvContent);

console.log('✓ CSV saved to: nonSonicReposAnalysis.csv\n');

// Generate Markdown table
const mdRows = [];

// Header
mdRows.push('| Component | Repo URL | Languages | Helmfile.d | Monorepo | Indicators |');
mdRows.push('|-----------|----------|-----------|------------|----------|------------|');

// Data rows (limited to first 50 for readability)
const displayLimit = 50;
results.slice(0, displayLimit).forEach(repo => {
    const languages = (repo.languages || 'Unknown').split(', ').slice(0, 3).join(', ');
    const hasHelmfileD = repo.hasHelmfileD === true ? '✓' : '✗';
    const isMonorepo = repo.isMonorepo === true ? '✓' : '✗';
    const indicators = (repo.monorepoIndicators || []).slice(0, 2).join(', ') || '-';

    mdRows.push(
        `| ${repo.component} | [Link](${repo.repo}) | ${languages} | ${hasHelmfileD} | ${isMonorepo} | ${indicators} |`
    );
});

if (results.length > displayLimit) {
    mdRows.push(`| ... | ... | ... | ... | ... | ... |`);
    mdRows.push(`| *${results.length - displayLimit} more rows* | | | | | |`);
}

const mdContent = mdRows.join('\n');
fs.writeFileSync('nonSonicReposAnalysis.md', mdContent);

console.log('✓ Markdown table saved to: nonSonicReposAnalysis.md\n');

// Console table (first 20 rows)
console.log('\n=== PREVIEW: First 20 Repositories ===\n');
console.log('Component'.padEnd(35) + ' | Languages'.padEnd(30) + ' | Helmfile | Monorepo');
console.log('-'.repeat(35) + '-+-' + '-'.repeat(30) + '-+----------+----------');

results.slice(0, 20).forEach(repo => {
    const component = (repo.component || '').substring(0, 33).padEnd(35);
    const languages = (repo.languages || 'Unknown').substring(0, 28).padEnd(30);
    const helmfile = repo.hasHelmfileD === true ? '   Yes  ' : repo.hasHelmfileD === false ? '   No   ' : ' Unknown';
    const monorepo = repo.isMonorepo === true ? '   Yes  ' : repo.isMonorepo === false ? '   No   ' : ' Unknown';

    console.log(`${component} | ${languages} | ${helmfile} | ${monorepo}`);
});

console.log('\n');

// Statistics
console.log('=== STATISTICS ===\n');

const successfulRepos = results.filter(r => !r.error);
const withLanguages = results.filter(r => r.languages && r.languages !== 'None detected' && r.languages !== 'Unknown');
const withHelmfileD = results.filter(r => r.hasHelmfileD === true);
const monorepos = results.filter(r => r.isMonorepo === true);

console.log(`Total Repositories: ${results.length}`);
console.log(`Successfully Analyzed: ${successfulRepos.length} (${((successfulRepos.length / results.length) * 100).toFixed(1)}%)`);
console.log(`With Detected Languages: ${withLanguages.length} (${((withLanguages.length / results.length) * 100).toFixed(1)}%)`);
console.log(`With Helmfile.d: ${withHelmfileD.length} (${((withHelmfileD.length / results.length) * 100).toFixed(1)}%)`);
console.log(`Monorepos: ${monorepos.length} (${((monorepos.length / results.length) * 100).toFixed(1)}%)`);

// Language breakdown
console.log('\n=== TOP 15 LANGUAGES ===\n');
const languageCounts = {};
results.forEach(r => {
    if (r.languages && r.languages !== 'None detected' && r.languages !== 'Unknown') {
        r.languages.split(', ').forEach(lang => {
            languageCounts[lang] = (languageCounts[lang] || 0) + 1;
        });
    }
});

Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([lang, count], idx) => {
        console.log(`${(idx + 1).toString().padStart(2)}. ${lang.padEnd(25)} ${count.toString().padStart(4)} repos`);
    });

console.log('\n');

// Monorepo indicators breakdown
console.log('=== MONOREPO INDICATORS ===\n');
const indicatorCounts = {};
results.forEach(r => {
    if (r.monorepoIndicators && r.monorepoIndicators.length > 0) {
        r.monorepoIndicators.forEach(indicator => {
            indicatorCounts[indicator] = (indicatorCounts[indicator] || 0) + 1;
        });
    }
});

if (Object.keys(indicatorCounts).length > 0) {
    Object.entries(indicatorCounts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([indicator, count]) => {
            console.log(`${indicator.padEnd(30)} ${count.toString().padStart(4)} repos`);
        });
} else {
    console.log('No monorepo indicators found.');
}

console.log('\n=== OUTPUT FILES ===\n');
console.log('✓ nonSonicReposAnalysis.csv  - Full data in CSV format');
console.log('✓ nonSonicReposAnalysis.md   - Markdown table (first 50 rows)');
console.log('✓ repoAnalysisResults.json   - Complete JSON data');
console.log('\n');
