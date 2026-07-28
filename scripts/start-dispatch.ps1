# 启动派单系统（standalone 发布包或源码目录均可）
param(
  [int]$Port = 0,
  [switch]$NoBrowser
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Read-EnvFile([string]$Path) {
  if (-not (Test-Path $Path)) { return @{} }
  $map = @{}
  Get-Content $Path -Encoding UTF8 | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) { return }
    $i = $line.IndexOf("=")
    if ($i -lt 1) { return }
    $k = $line.Substring(0, $i).Trim()
    $v = $line.Substring($i + 1).Trim()
    $map[$k] = $v
  }
  return $map
}

function Test-NodeVersion {
  $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
  if (-not $nodeCmd) {
    Write-Host "未检测到 Node.js。请先安装 Node.js 20+：" -ForegroundColor Red
    Write-Host "  winget install OpenJS.NodeJS.LTS"
    Write-Host "  或访问 https://nodejs.org/"
    exit 1
  }
  $ver = (node -v) -replace "^v", ""
  $major = [int]($ver.Split(".")[0])
  if ($major -lt 20) {
    Write-Host "需要 Node.js 20+，当前: v$ver" -ForegroundColor Red
    exit 1
  }
}

Test-NodeVersion

$envPath = Join-Path $Root ".env.local"
if (-not (Test-Path $envPath)) {
  $example = Join-Path $Root "deploy\env.local.example"
  if (Test-Path $example) {
    Copy-Item $example $envPath
    Write-Host "已生成 .env.local，请编辑 SYNC_API_KEY 后重新启动。" -ForegroundColor Yellow
  } else {
    Write-Host "缺少 .env.local，请参考 deploy/env.local.example 创建。" -ForegroundColor Red
    exit 1
  }
}

$envMap = Read-EnvFile $envPath
foreach ($key in $envMap.Keys) {
  Set-Item -Path "env:$key" -Value $envMap[$key]
}

if ($Port -gt 0) {
  $env:PORT = "$Port"
} elseif (-not $env:PORT) {
  $env:PORT = "3000"
}
if (-not $env:HOSTNAME) { $env:HOSTNAME = "0.0.0.0" }
if (-not $env:NODE_ENV) { $env:NODE_ENV = "production" }
if (-not $env:SYNC_DATA_DIR) {
  $env:SYNC_DATA_DIR = (Join-Path $Root "data")
}
New-Item -ItemType Directory -Force -Path $env:SYNC_DATA_DIR | Out-Null

$standalone = Join-Path $Root "server.js"
$sourceMode = -not (Test-Path $standalone)

$url = "http://127.0.0.1:$($env:PORT)"

if ($sourceMode) {
  if (-not (Test-Path (Join-Path $Root ".next\BUILD_ID"))) {
    Write-Host "源码模式：正在构建..." -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  }
  Write-Host "启动 Next.js (源码模式) $url" -ForegroundColor Green
  if (-not $NoBrowser) {
    Start-Process $url
  }
  npm run start
} else {
  Write-Host "启动派单系统 (standalone) $url" -ForegroundColor Green
  if (-not $NoBrowser) {
    Start-Sleep -Seconds 2
    Start-Process $url
  }
  node server.js
}
