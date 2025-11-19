const fs = require('fs');
const https = require('https');

// Configuration
const GITHUB_ENTERPRISE_URL = 'github.je-labs.com';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''; // Set via environment variable

// Read the analysis template
const repos = JSON.parse(fs.readFileSync('./repoAnalysisTemplate.json', 'utf8'));

// Track progress
let completed = 0;
let failed = 0;
const results = [];

// Helper function to make GitHub API calls
function makeGitHubRequest(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: GITHUB_ENTERPRISE_URL,
            path: `/api/v3${path}`,
            method: 'GET',
            headers: {
                'User-Agent': 'Node.js Script',
                'Accept': 'application/vnd.github.v3+json'
            }
        };

        if (GITHUB_TOKEN) {
            options.headers['Authorization'] = `token ${GITHUB_TOKEN}`;
        }

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error(`Failed to parse JSON: ${e.message}`));
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

// Check if directory/file exists in repo
async function checkForHelmfileD(org, repo) {
    try {
        const contents = await makeGitHubRequest(`/repos/${org}/${repo}/contents`);
        return contents.some(item => item.name === 'helmfile.d' && item.type === 'dir');
    } catch (error) {
        console.error(`  Error checking helmfile.d: ${error.message}`);
        return false;
    }
}

// Check for monorepo indicators
async function checkMonorepo(org, repo) {
    try {
        const contents = await makeGitHubRequest(`/repos/${org}/${repo}/contents`);
        
        // Check for common monorepo indicators
        const monorepoIndicators = [
            'lerna.json',
            'nx.json',
            'pnpm-workspace.yaml',
            'turbo.json',
            'packages',
            'apps',
            'services'
        ];
        
        const foundIndicators = contents
            .filter(item => monorepoIndicators.includes(item.name))
            .map(item => item.name);

        // Additional check for workspace in package.json
        try {
            const packageJson = await makeGitHubRequest(`/repos/${org}/${repo}/contents/package.json`);
            if (packageJson.content) {
                const content = Buffer.from(packageJson.content, 'base64').toString();
                const pkg = JSON.parse(content);
                if (pkg.workspaces) {
                    foundIndicators.push('package.json:workspaces');
                }
            }
        } catch (e) {
            // No package.json or error reading it
        }

        return {
            isMonorepo: foundIndicators.length > 0,
            indicators: foundIndicators
        };
    } catch (error) {
        console.error(`  Error checking monorepo: ${error.message}`);
        return { isMonorepo: false, indicators: [] };
    }
}

// Analyze a single repository
async function analyzeRepo(repoInfo, index) {
    console.log(`\n[${index + 1}/${repos.length}] Analyzing: ${repoInfo.component}`);
    console.log(`  Repo: ${repoInfo.org}/${repoInfo.repoName}`);

    const result = {
        ...repoInfo
    };

    try {
        // Get languages
        console.log('  Fetching languages...');
        const languages = await makeGitHubRequest(`/repos/${repoInfo.org}/${repoInfo.repoName}/languages`);
        result.languages = Object.keys(languages).join(', ') || 'None detected';
        result.languageBytes = languages;

        // Check for helmfile.d
        console.log('  Checking for helmfile.d...');
        result.hasHelmfileD = await checkForHelmfileD(repoInfo.org, repoInfo.repoName);

        // Check for monorepo
        console.log('  Checking monorepo indicators...');
        const monorepoCheck = await checkMonorepo(repoInfo.org, repoInfo.repoName);
        result.isMonorepo = monorepoCheck.isMonorepo;
        result.monorepoIndicators = monorepoCheck.indicators;

        console.log(`  ✓ Success - Languages: ${result.languages}`);
        completed++;
    } catch (error) {
        console.error(`  ✗ Failed: ${error.message}`);
        result.error = error.message;
        failed++;
    }

    return result;
}

// Main execution
async function main() {
    if (!GITHUB_TOKEN) {
        console.log('WARNING: No GITHUB_TOKEN environment variable set.');
        console.log('API rate limits will be very restrictive without authentication.\n');
        console.log('Set token with: $env:GITHUB_TOKEN="your-token-here"\n');
    }

    console.log(`Starting analysis of ${repos.length} repositories...`);
    console.log('This may take a while...\n');

    // Process repos in batches to avoid overwhelming the API
    const BATCH_SIZE = 10;
    const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds

    for (let i = 0; i < repos.length; i += BATCH_SIZE) {
        const batch = repos.slice(i, i + BATCH_SIZE);
        
        console.log(`\n--- Processing batch ${Math.floor(i / BATCH_SIZE) + 1} ---`);
        
        const batchResults = await Promise.all(
            batch.map((repo, idx) => analyzeRepo(repo, i + idx))
        );

        results.push(...batchResults);

        // Save progress after each batch
        fs.writeFileSync('repoAnalysisResults.json', JSON.stringify(results, null, 2));
        
        console.log(`\nProgress: ${results.length}/${repos.length} | Success: ${completed} | Failed: ${failed}`);

        // Delay between batches (except for the last batch)
        if (i + BATCH_SIZE < repos.length) {
            console.log(`Waiting ${DELAY_BETWEEN_BATCHES / 1000}s before next batch...`);
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
        }
    }

    console.log('\n========================================');
    console.log('Analysis Complete!');
    console.log(`Total: ${repos.length} | Success: ${completed} | Failed: ${failed}`);
    console.log('Results saved to: repoAnalysisResults.json');
    console.log('========================================\n');

    // Generate summary report
    generateReport(results);
}

// Generate a summary report
function generateReport(results) {
    console.log('\n=== SUMMARY REPORT ===\n');

    // Language statistics
    const languageCounts = {};
    results.forEach(r => {
        if (r.languages && r.languages !== 'None detected') {
            r.languages.split(', ').forEach(lang => {
                languageCounts[lang] = (languageCounts[lang] || 0) + 1;
            });
        }
    });

    console.log('Top Languages:');
    Object.entries(languageCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([lang, count]) => {
            console.log(`  ${lang}: ${count} repos`);
        });

    // Helmfile.d statistics
    const withHelmfileD = results.filter(r => r.hasHelmfileD === true).length;
    console.log(`\nHelmfile.d: ${withHelmfileD} repos (${((withHelmfileD / results.length) * 100).toFixed(1)}%)`);

    // Monorepo statistics
    const monorepos = results.filter(r => r.isMonorepo === true).length;
    console.log(`Monorepos: ${monorepos} repos (${((monorepos / results.length) * 100).toFixed(1)}%)`);

    // Save summary
    const summary = {
        totalRepos: results.length,
        successful: completed,
        failed: failed,
        languageCounts,
        withHelmfileD,
        monorepos
    };

    fs.writeFileSync('analysisSummary.json', JSON.stringify(summary, null, 2));
}

// Run the script
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
