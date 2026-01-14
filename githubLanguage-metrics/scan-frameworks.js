// scan-frameworks.js
// Requirements:
// npm install axios csv-writer

const axios = require("axios");
const fs = require("fs");
const { createObjectCsvWriter } = require("csv-writer");


// --- CONFIG ---
// Set your GitHub Enterprise base URL, e.g.
// https://ghe.mycompany.com/api/v3
const GITHUB_API = " https://github.je-labs.com/api/v3";
const TOKEN = process.env.GH_TOKEN;

if (!TOKEN || !GITHUB_API) {
    console.error("❌ ERROR: Missing environment variables GH_TOKEN or GITHUB_API_URL");
    process.exit(1);
}

// Get all orgs for the authenticated user
async function getAllOrgs() {
    try {
        const res = await api.get("/user/orgs");
        return res.data.map(org => org.login);
    } catch (err) {
        console.error("❌ Error fetching orgs:", err.response?.data || err.message);
        process.exit(1);
    }
}

const api = axios.create({
    baseURL: GITHUB_API,
    headers: {
        Authorization: `token ${TOKEN}`,
        Accept: "application/vnd.github.v3+json"
    }
});

// CSV writer setup
const csvWriter = createObjectCsvWriter({
    path: "repo-frameworks.csv",
    header: [
        { id: "name", title: "Repository" },
        { id: "framework", title: "Framework" },
        { id: "createdAt", title: "Created At" }
    ]
});

// Framework detection patterns
const FRAMEWORK_MAP = {
    react: ["react", "react-dom", "next", "gatsby"],
    vue: ["vue", "vue-router", "nuxt", "nuxt3"],
    angular: ["@angular/core", "@angular/cli"],
    svelte: ["svelte", "@sveltejs/kit"],
    node: ["express", "koa", "fastify"]
};

function detectFramework(deps = {}) {
    const allDeps = Object.keys(deps).map(d => d.toLowerCase());

    for (const [framework, patterns] of Object.entries(FRAMEWORK_MAP)) {
        if (patterns.some(p => allDeps.includes(p.toLowerCase()))) {
            return framework;
        }
    }

    return "none";
}

async function getAllRepos() {
    let page = 1;
    const repos = [];

    // This function is now unused, replaced by getAllReposForOrg
    return [];
}

async function getAllReposForOrg(org) {
    let page = 1;
    const repos = [];
    while (true) {
        try {
            const res = await api.get(`/orgs/${org}/repos`, {
                params: { per_page: 100, page }
            });
            if (res.data.length === 0) break;
            repos.push(...res.data);
            page++;
        } catch (err) {
            console.error(`❌ Error fetching repos for org ${org}:`, err.response?.data || err.message);
            break;
        }
    }
    return repos;
}

async function getPackageJson(owner, repo) {
    try {
        const res = await api.get(`/repos/${owner}/${repo}/contents/package.json`);
        const fileContent = Buffer.from(res.data.content, "base64").toString("utf8");
        return JSON.parse(fileContent);
    } catch (err) {
        return null; // Repo may not have package.json
    }
}

(async () => {
    console.log("🔎 Fetching organizations...");
    const orgs = await getAllOrgs();
    const allResults = [];
    for (const org of orgs) {
        console.log(`\n=== Scanning org: ${org} ===`);
        const repos = await getAllReposForOrg(org);
        for (const repo of repos) {
            try {
                const pkg = await getPackageJson(repo.owner.login, repo.name);
                let framework = "none";
                if (pkg) {
                    framework = detectFramework({
                        ...pkg.dependencies,
                        ...pkg.devDependencies
                    });
                }
                allResults.push({
                    name: `${org}/${repo.name}`,
                    framework,
                    createdAt: repo.created_at
                });
                console.log(`✔ ${org}/${repo.name}: ${framework}`);
            } catch (err) {
                console.error(`❌ Error processing repo ${org}/${repo.name}:`, err.message);
            }
        }
    }
    // Write to CSV
    await csvWriter.writeRecords(allResults);
    console.log("\n📄 CSV exported: repo-frameworks.csv");
})();
