# Non-Sonic Repositories Analysis

## Summary

**Total Non-Sonic Components with Repositories:** 3,203

This analysis extracts all components from `componentsResponse.json` where `isSonic: false` and contains a repository URL.

## Top Organizations

| Rank | Organization | Repository Count |
|------|-------------|------------------|
| 1 | Hackathon | 406 |
| 2 | cps-eu | 151 |
| 3 | WTE | 129 |
| 4 | https | 120 |
| 5 | Infrastructure | 117 |
| 6 | jetconnect | 112 |
| 7 | just-data | 75 |
| 8 | ca-customer | 67 |
| 9 | cps | 52 |
| 10 | operations-order-management-ta | 50 |

## Sample Repositories

Here are the first 25 non-Sonic repositories:

| Component | Repository URL | Organization |
|-----------|---------------|--------------|
| marathon | https://github.je-labs.com/platform-self-service/marathon-deploys | platform-self-service |
| displayadscampaigns | https://github.je-labs.com/display-advertisement/displayadscampaigns | display-advertisement |
| miroauditandaccessremediation | https://github.je-labs.com/WTE/miroauditandaccessremediation | WTE |
| zendeskchattoggle | https://github.je-labs.com/WTE/ZendeskChatToggle | WTE |
| orderinjectionstatusupdater | https://github.je-labs.com/jetconnect/order-injection-status-updater | jetconnect |
| cosigninfra | https://github.je-labs.com/InfoSec/cosign-infra | InfoSec |
| customerrecentorders | https://github.je-labs.com/ca-customer/customer_recent_orders | ca-customer |
| concourseplt | https://github.je-labs.com/Infrastructure/concourseplt | Infrastructure |
| tksmtp | https://github.je-labs.com/GBPI/aws-infrastructure-gbpi | GBPI |
| helmmissingcontainermetrics | https://github.je-labs.com/cps-eu/helm-charts-missing-container-metrics | cps-eu |
| socautopythonlayer | https://github.je-labs.com/SOC/socautopythonlayer | SOC |
| legacymenuconverter | https://github.je-labs.com/jetconnect/legacy-menu-converter | jetconnect |
| notificationsandroid | https://github.je-labs.com/Android/app-core | Android |
| cnimetricshelper | https://github.je-labs.com/cps/helm-core | cps |
| slackchannelnamingenforcer | https://github.je-labs.com/WTE/SlackChannelNamingEnforcer | WTE |
| logstash | https://github.je-labs.com/ansible-roles/configure-logstash | ansible-roles |
| liveopsdds | https://github.je-labs.com/ca-ops/live_ops_dds | ca-ops |
| menusyncstatusupdater | https://github.je-labs.com/jetconnect/menu-sync-status-updater | jetconnect |
| pythonbak | https://github.je-labs.com/cps-eu/docker-python-bak | cps-eu |
| checkouteventsconnect | https://github.je-labs.com/checkout/checkouteventsconnect | checkout |
| chatcontroller | https://github.je-labs.com/team-x/chat-controller | team-x |
| giftcardsdb | https://github.je-labs.com/GiftCards/JE.GiftCards.DB | GiftCards |
| testcomponentc8xs | https://github.je-labs.com/Hackathon/testcomponentc8xs | Hackathon |
| talsupertest | https://github.je-labs.com/DevEx/talsupertest | DevEx |
| puppetfir | https://github.je-labs.com/puppetmodules/puppet-fir | puppetmodules |

## Next Steps: Fetch Repository Details

To complete the analysis with languages, helmfile.d detection, and monorepo identification:

### Prerequisites
1. **GitHub Enterprise Personal Access Token** with `repo` scope
2. Access to `github.je-labs.com` API

### Instructions

#### Step 1: Set GitHub Token
```powershell
$env:GITHUB_TOKEN="your-personal-access-token-here"
```

#### Step 2: Run Analysis
```powershell
node fetchRepoDetails.js
```

This will:
- Fetch programming languages for each repository
- Check for `helmfile.d` directory presence
- Detect monorepo indicators (lerna.json, nx.json, workspaces, etc.)
- Save progress after each batch of 10 repos
- Generate `repoAnalysisResults.json`

#### Step 3: Generate Table
```powershell
node generateRepoTable.js
```

This will create:
- **nonSonicReposAnalysis.csv** - Complete data in CSV format
- **nonSonicReposAnalysis.md** - Markdown table preview
- Console output with statistics and summaries

### What Will Be Analyzed

For each of the 3,203 repositories, the analysis will determine:

1. **Languages** - Programming languages used (from GitHub API)
2. **Has Helmfile.d** - Whether the repo contains a `helmfile.d` directory
3. **Is Monorepo** - Whether the repo is a monorepo based on:
   - `lerna.json`
   - `nx.json`
   - `pnpm-workspace.yaml`
   - `turbo.json`
   - `package.json` with workspaces
   - Presence of `packages/`, `apps/`, or `services/` directories

## Generated Files

- ✅ **nonSonicRepoList.json** - All non-Sonic components with their repos
- ✅ **repoAnalysisTemplate.json** - Parsed org/repo structure ready for analysis
- ✅ **nonSonicRepoURLs.txt** - Simple text list of all repository URLs
- ✅ **nonSonicReposSummary.json** - Summary statistics
- ⏳ **repoAnalysisResults.json** - Full analysis results (after running fetchRepoDetails.js)
- ⏳ **nonSonicReposAnalysis.csv** - Analysis in CSV format (after running generateRepoTable.js)
- ⏳ **nonSonicReposAnalysis.md** - Analysis in Markdown table (after running generateRepoTable.js)

## Notes

- The analysis processes repositories in batches of 10 with 2-second delays to respect API rate limits
- Progress is saved after each batch in case of interruption
- Without authentication, GitHub API rate limits are very restrictive
- The script will take approximately 30-40 minutes to complete all 3,203 repositories
