param(
  [string]$ServerUrl,
  [string]$OutDir,
  [int]$KeepWeeks = 12
)

$ErrorActionPreference = "Stop"

if (-not $ServerUrl) { $ServerUrl = $env:DISPATCH_BACKUP_URL }
if (-not $OutDir) { $OutDir = $env:DISPATCH_BACKUP_DIR }
if (-not $OutDir) {
  $OutDir = Join-Path $env:USERPROFILE "Documents\dispatch-cloud-backups"
}

if (-not $ServerUrl) {
  Write-Error "Set -ServerUrl or env DISPATCH_BACKUP_URL, e.g. http://121.199.20.177"
}

$baseUrl = $ServerUrl.Trim().TrimEnd("/")
$apiUrl = "$baseUrl/api/sync"
$now = Get-Date
$cal = [System.Globalization.CultureInfo]::CurrentCulture.Calendar
$weekNum = $cal.GetWeekOfYear(
  $now,
  [System.Globalization.CalendarWeekRule]::FirstFourDayWeek,
  [DayOfWeek]::Monday
)
$weekLabel = "{0}-W{1:D2}" -f $now.Year, $weekNum
$dayLabel = (Get-Date).ToString("yyyy-MM-dd")
$weekDir = Join-Path $OutDir $weekLabel
$outFile = Join-Path $weekDir "snapshot-$dayLabel.json"
$latestFile = Join-Path $OutDir "snapshot-latest.json"

New-Item -ItemType Directory -Force -Path $weekDir | Out-Null

Write-Host "Fetching: $apiUrl"
$response = Invoke-WebRequest -Uri $apiUrl -Method Get -TimeoutSec 120 -UseBasicParsing
if ($response.StatusCode -ne 200) {
  throw "HTTP $($response.StatusCode)"
}

$json = $response.Content
$utf8 = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($outFile, $json, $utf8)
[System.IO.File]::WriteAllText($latestFile, $json, $utf8)

Write-Host "Saved: $outFile"
Write-Host "Latest: $latestFile"

if ($KeepWeeks -gt 0) {
  $cutoff = (Get-Date).AddDays(-7 * $KeepWeeks)
  Get-ChildItem -Path $OutDir -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match "^\d{4}-W\d{2}$" -and $_.LastWriteTime -lt $cutoff } |
    ForEach-Object {
      Remove-Item -LiteralPath $_.FullName -Recurse -Force
      Write-Host "Removed old: $($_.Name)"
    }
}
