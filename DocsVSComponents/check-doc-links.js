const fs = require('fs');
const https = require('https');
const urls = [];
const lines = fs.readFileSync('DocsVSComponents/match-table.md', 'utf-8').split('\n');
for (const line of lines) {
  // Split markdown table row, get third column (Doc URL)
  if (line.startsWith('|')) {
    const cols = line.split('|').map(s => s.trim());
    if (cols[3] && cols[3].startsWith('https://sonic.staging.jet-internal.com/components/')) {
      urls.push(cols[3]);
    }
  }
}

const BATCH_SIZE = 10;
const report = [];

function checkUrl(url) {
  return new Promise((resolve) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (link-checker)' }
    }, (res) => {
      resolve({ url, status: res.statusCode });
    });
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ url, status: 'TIMEOUT' });
    });
    req.on('error', () => {
      resolve({ url, status: 'ERROR' });
    });
  });
}

(async () => {
  for (let i = 0; i < urls.length; i += BATCH_SIZE) {
    const batch = urls.slice(i, i + BATCH_SIZE);
    console.log(`\nChecking batch ${i/BATCH_SIZE+1} (${i+1}-${i+batch.length})`);
    const results = await Promise.all(batch.map(checkUrl));
    results.forEach(r => {
      const msg = `${r.url} => ${r.status}`;
      console.log(msg);
      report.push(msg);
    });
  }
  fs.writeFileSync('DocsVSComponents/link-report.txt', report.join('\n'), 'utf-8');
})();
