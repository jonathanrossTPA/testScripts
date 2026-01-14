import fetch from "node-fetch";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------- CONFIG -------------------
const GITHUB_API_URL = process.env.GITHUB_API_URL || "https://github.je-labs.com/api/v3";
const TOKEN = process.env.GH_TOKEN;
if (!TOKEN) {
  console.error("Error: GH_TOKEN environment variable not set.");
  process.exit(1);
}

const REACT_LANGS = ["JavaScript", "TypeScript"];
const FROM_DATE = "2024-01-01";   // last year

function getMonth(dateStr) {
  return dateStr.substring(0, 7); // YYYY-MM
}

async function fetchRepos(page = 1) {
  const url = `${GITHUB_API_URL}/search/repositories?q=created:>=${FROM_DATE}+language:JavaScript+language:TypeScript&sort=created&order=asc&per_page=100&page=${page}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `token ${TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}

async function main() {
  let page = 1;
  let repos = [];
  let total = 0;
  console.log("Fetching repos...");
  while (true) {
    console.log(`Fetching page ${page}...`);
    const data = await fetchRepos(page);
    repos = repos.concat(data.items);
    total += data.items.length;
    if (data.items.length < 100) break;
    page++;
  }
  console.log(`Fetched ${total} repos.`);

  // ---------------- AGGREGATION -------------------
  const monthlyCounts = {};
  for (const repo of repos) {
    const lang = repo.language;
    const created = getMonth(repo.created_at);
    if (!REACT_LANGS.includes(lang)) continue;
    if (!monthlyCounts[created]) monthlyCounts[created] = 0;
    monthlyCounts[created]++;
  }
  const sorted = Object.entries(monthlyCounts).sort((a, b) => a[0].localeCompare(b[0]));
  const csv = "month,count\n" + sorted.map(r => r.join(",")).join("\n");
  const outPath = path.join(__dirname, "react-repo-metrics.csv");
  fs.writeFileSync(outPath, csv);
  console.log(`Metrics saved to ${outPath}`);
}

main();