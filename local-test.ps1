<#
.SYNOPSIS
  Automated local validation script for .NET + Docker + Helm project on Windows 11.

.DESCRIPTION
  This script restores, builds, and tests a .NET project, builds and runs a Docker image,
  performs Helm linting and dry-run, and optionally deploys to a local Kubernetes cluster.
#>

param(
    [string]$ProjectPath = "./src/YourApp",
    [string]$DockerImageName = "yourapp:local",
    [string]$HelmChartPath = "./helm/your-app",
    [string]$HelmReleaseName = "your-app",
    [switch]$DeployK8s
)

Write-Host "🚀 Starting local validation for $ProjectPath" -ForegroundColor Cyan

# --- 1. Restore & Build ---
Write-Host "🧰 Restoring .NET dependencies..." -ForegroundColor Yellow
dotnet restore $ProjectPath
if ($LASTEXITCODE -ne 0) { Write-Error "❌ dotnet restore failed"; exit 1 }

Write-Host "🏗️ Building project..." -ForegroundColor Yellow
dotnet build $ProjectPath --configuration Release
if ($LASTEXITCODE -ne 0) { Write-Error "❌ dotnet build failed"; exit 1 }

# --- 2. Run Tests ---
Write-Host "🧪 Running tests..." -ForegroundColor Yellow
dotnet test
if ($LASTEXITCODE -ne 0) { Write-Error "❌ dotnet test failed"; exit 1 }

# --- 3. Docker Build ---
Write-Host "🐳 Building Docker image $DockerImageName..." -ForegroundColor Yellow
docker build -t $DockerImageName .
if ($LASTEXITCODE -ne 0) { Write-Error "❌ Docker build failed"; exit 1 }

# --- 4. Run Docker Container (Optional Smoke Test) ---
Write-Host "🚦 Running Docker container for smoke test..." -ForegroundColor Yellow
$containerId = docker run -d -p 8080:80 $DockerImageName
Start-Sleep -Seconds 5
docker ps

Write-Host "🌐 Testing container endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Health check passed."
    } else {
        Write-Warning "⚠️ Health check returned status code $($response.StatusCode)"
    }
} catch {
    Write-Warning "⚠️ Could not reach health endpoint: $_"
}

docker stop $containerId | Out-Null
docker rm $containerId | Out-Null

# --- 5. Helm Lint ---
Write-Host "🔍 Linting Helm chart at $HelmChartPath..." -ForegroundColor Yellow
helm lint $HelmChartPath
if ($LASTEXITCODE -ne 0) { Write-Error "❌ Helm lint failed"; exit 1 }

# --- 6. Helm Dry Run ---
Write-Host "🧪 Running Helm dry-run for $HelmReleaseName..." -ForegroundColor Yellow
helm install $HelmReleaseName $HelmChartPath --dry-run --debug
if ($LASTEXITCODE -ne 0) { Write-Error "❌ Helm dry-run failed"; exit 1 }

# --- 7. Optional Local Deployment ---
if ($DeployK8s) {
    Write-Host "☸️ Deploying $HelmReleaseName to local Kubernetes cluster..." -ForegroundColor Yellow
    helm upgrade --install $HelmReleaseName $HelmChartPath
    kubectl get pods
    Write-Host "🌐 Port-forwarding service to localhost:8080" -ForegroundColor Green
    Write-Host "👉 Press Ctrl+C to stop forwarding when done."
    kubectl port-forward svc/$HelmReleaseName 8080:80
}

Write-Host "🎉 All steps completed successfully." -ForegroundColor Green
