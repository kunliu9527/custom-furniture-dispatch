# 每周从云端自动备份到本机（Windows）

云端数据在服务器上的 `snapshot.json`（或 Redis）。本机可通过公开的 **只读接口** `GET /api/sync` 定期下载整份 JSON，无需登录浏览器。

## 1. 手动试跑一次

在 PowerShell 中（把地址改成你的阿里云 IP 或域名）：

```powershell
cd D:\custom-furniture-dispatch

$env:DISPATCH_BACKUP_URL = "http://121.199.20.177"
$env:DISPATCH_BACKUP_DIR = "D:\dispatch-cloud-backups"

powershell -ExecutionPolicy Bypass -File .\scripts\backup-cloud-to-local.ps1
```

成功后目录类似：

```
D:\dispatch-cloud-backups\
  snapshot-latest.json          ← 始终为最近一次备份
  2026-W22\
    snapshot-2026-05-27.json    ← 当周某天的备份（每周任务会追加新日期文件）
```

默认保留最近 **12 周** 的文件夹，更早的会自动删除（可用 `-KeepWeeks 0` 关闭清理）。

## 2. 注册「每周」计划任务

例如：**每周日 凌晨 2:00** 执行一次（按需改星期与时间）：

```powershell
$script = "D:\custom-furniture-dispatch\scripts\backup-cloud-to-local.ps1"
$action = "powershell.exe -NoProfile -ExecutionPolicy Bypass -File `"$script`""

schtasks /Create /F /TN "CustomFurnitureDispatch-WeeklyBackup" `
  /SC WEEKLY /D SUN /ST 02:00 `
  /TR $action `
  /RL LIMITED

setx DISPATCH_BACKUP_URL "http://121.199.20.177"
setx DISPATCH_BACKUP_DIR "D:\dispatch-cloud-backups"
```

> `setx` 写入用户环境变量后，**新开** PowerShell/计划任务进程才会读到。也可在「任务计划程序」→ 任务属性 →「操作」里直接写死 URL（见下）。

### 图形界面（可选）

1. `Win + R` → `taskschd.msc`
2. 创建基本任务 → 触发器：**每周** → 选星期几
3. 操作：启动程序  
   - 程序：`powershell.exe`  
   - 参数：`-NoProfile -ExecutionPolicy Bypass -File "D:\custom-furniture-dispatch\scripts\backup-cloud-to-local.ps1" -ServerUrl "http://121.199.20.177" -OutDir "D:\dispatch-cloud-backups"`

## 3. 恢复备份到本机开发环境（可选）

若要在 `npm run dev` 里用某次备份：

1. 复制 `snapshot-YYYY-MM-DD.json` 为本地数据目录下的 `snapshot.json`
2. `.env.local` 中 `SYNC_STORAGE=file`，`SYNC_DATA_DIR` 指向该目录（或默认 `项目/data/`）
3. 重启 `npm run dev`

## 4. 说明

| 项目 | 说明 |
|------|------|
| 权限 | `GET /api/sync` 为只读，不需 `SYNC_API_KEY`；写入仍受密钥保护 |
| 与浏览器同步 | 日常操作请继续访问云端地址；本备份仅作归档/灾难恢复 |
| 程序升级 | `git pull` + 重建**不会**删除服务器上的 `snapshot.json`；本备份是额外保险 |
| 服务器侧备份 | 还建议在 ECS 上对 `/var/lib/custom-furniture-dispatch/snapshot.json` 做 `cron` 拷贝（见 `CHINA-SERVER-DEPLOY.md`） |
