# 在本机安装派单系统（Windows）
# 用法：
#   从源码安装：  powershell -ExecutionPolicy Bypass -File scripts/install-local.ps1
#   指定目录：    powershell -ExecutionPolicy Bypass -File scripts/install-local.ps1 -TargetDir D:\dispatch
param(
  [string]$TargetDir = "",
  [string]$GitRepo = "https://github.com/kunliu9527/custom-furniture-dispatch.git",
  [switch]$FromRelease,
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

function Test-NodeVersion {
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "正在尝试通过 winget 安装 Node.js LTS..." -ForegroundColor Cyan
    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if ($winget) {
      winget install --id OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
      $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
        [System.Environment]::GetEnvironmentVariable("Path", "User")
    }
  }
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "请先安装 Node.js 20+：https://nodejs.org/ 或 winget install OpenJS.NodeJS.LTS"
  }
  $major = [int](((node -v) -replace "^v", "").Split(".")[0])
  if ($major -lt 20) { Write-Error "需要 Node.js 20+，当前 $(node -v)" }
}

function New-SyncApiKey {
  return -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ })
}

Test-NodeVersion

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$SourceRoot = Split-Path -Parent $ScriptDir

if (-not $TargetDir) {
  $TargetDir = Join-Path $env:LOCALAPPDATA "CustomFurnitureDispatch"
}

$isStandalone = Test-Path (Join-Path $SourceRoot "server.js")
$installFromCurrent = -not $FromRelease -and (Test-Path (Join-Path $SourceRoot "package.json"))

if ($installFromCurrent -and ((Resolve-Path $SourceRoot).Path -eq (Resolve-Path $TargetDir -ErrorAction SilentlyContinue).Path)) {
  $AppDir = $SourceRoot
} elseif ($installFromCurrent -and -not $isStandalone) {
  Write-Host "复制源码到 $TargetDir ..." -ForegroundColor Cyan
  New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null
  robocopy $SourceRoot $TargetDir /MIR /XD node_modules .next release .git /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
  if ($LASTEXITCODE -ge 8) { throw "复制失败 robocopy exit $LASTEXITCODE" }
  $AppDir = $TargetDir
} elseif (-not (Test-Path (Join-Path $TargetDir "package.json")) -and -not (Test-Path (Join-Path $TargetDir "server.js"))) {
  Write-Host "克隆仓库到 $TargetDir ..." -ForegroundColor Cyan
  New-Item -ItemType Directory -Force -Path (Split-Path $TargetDir) | Out-Null
  if (Test-Path $TargetDir) { Remove-Item -Recurse -Force $TargetDir }
  git clone $GitRepo $TargetDir
  $AppDir = $TargetDir
} else {
  $AppDir = $TargetDir
}

Set-Location $AppDir

$envFile = Join-Path $AppDir ".env.local"
if (-not (Test-Path $envFile)) {
  $key = New-SyncApiKey
  $dataDir = Join-Path $AppDir "data"
  @"
NEXT_PUBLIC_REMOTE_SYNC=true
SYNC_API_KEY=$key
NEXT_PUBLIC_SYNC_API_KEY=$key
SYNC_STORAGE=file
SYNC_DATA_DIR=$dataDir
PORT=3000
HOSTNAME=0.0.0.0
NODE_ENV=production
"@ | Set-Content -Path $envFile -Encoding UTF8
  Write-Host "已生成 .env.local（同步密钥已随机生成，请妥善保存）" -ForegroundColor Green
}

New-Item -ItemType Directory -Force -Path (Join-Path $AppDir "data") | Out-Null

if (-not $SkipBuild) {
  if (Test-Path (Join-Path $AppDir "server.js")) {
    Write-Host "检测到 standalone 发布包，跳过构建。" -ForegroundColor Cyan
  } else {
    Write-Host "安装依赖..." -ForegroundColor Cyan
    npm install
    Write-Host "构建应用..." -ForegroundColor Cyan
    npm run build
  }
}

$startBat = Join-Path $AppDir "scripts\start-dispatch.bat"
if (-not (Test-Path $startBat)) {
  Write-Warning "未找到 start-dispatch.bat，请使用 npm run start"
} else {
  $desktop = [Environment]::GetFolderPath("Desktop")
  $shortcutPath = Join-Path $desktop "派单系统.lnk"
  $wsh = New-Object -ComObject WScript.Shell
  $sc = $wsh.CreateShortcut($shortcutPath)
  $sc.TargetPath = $startBat
  $sc.WorkingDirectory = $AppDir
  $sc.Description = "定制家具派单系统"
  $sc.Save()
  Write-Host "已创建桌面快捷方式：派单系统" -ForegroundColor Green
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  安装完成"
Write-Host "  目录: $AppDir"
Write-Host "  启动: 双击桌面「派单系统」或运行 scripts\start-dispatch.bat"
Write-Host "  访问: http://localhost:3000"
Write-Host "  数据: $(Join-Path $AppDir 'data')"
Write-Host "============================================" -ForegroundColor Green
