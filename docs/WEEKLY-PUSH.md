# 周报推送方案说明

## 推荐优先级（由易到难）

| 方式 | 难度 | 说明 |
|------|------|------|
| **系统内简报** | 最低 | 已实现：经理看板「本周管理简报」+ 导航「通知」铃铛 |
| **复制文本** | 最低 | 简报页「复制周报文本」，粘贴到任意微信群 |
| **企业微信群机器人** | 低 | 配置 `WECOM_WEBHOOK_URL`，点击「推送到企微群」 |
| **定时自动推送** | 中 | 服务器 cron 每周一请求 `/api/weekly-digest/push` |
| **微信公众号/个人微信** | 高 | 需公众号资质或第三方服务，不建议首期做 |

## 为什么不优先做「个人微信推送」

- 微信没有官方「给个人发消息」的开放 API（除公众号模板消息、企业微信应用消息等）
- 个人微信机器人属于非官方方案，存在封号风险
- **企微群 webhook** 或 **复制粘贴** 对管理岗通常已够用

## 企业微信配置（可选）

1. 在企业微信群 → 群设置 → 群机器人 → 添加
2. 复制 webhook 地址
3. 在服务器 `.env` 或 `.env.local` 增加：

```env
WECOM_WEBHOOK_URL=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=YOUR_KEY
# 可选：推送接口鉴权（与 SYNC_API_KEY 二选一或同时）
DIGEST_PUSH_KEY=your-secret
```

4. 部署后，经理看板简报区会出现「推送到企微群」按钮

## 定时周报（推荐）

已提供脚本，**从服务器 snapshot 自动生成正文并推送企微**，无需手写 text。

### 1. 环境变量（`/opt/custom-furniture-dispatch/.env.local`）

```env
WECOM_WEBHOOK_URL=https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=YOUR_KEY
DIGEST_PUSH_KEY=请设一串随机密钥
```

### 2. 手动测试（服务器上，需 pm2 已运行 dispatch）

```bash
cd /opt/custom-furniture-dispatch
npm run digest:preview   # 仅生成，不推送
npm run digest:cron      # 生成并推送企微
# 或
bash scripts/weekly-digest-cron.sh
```

### 3. 安装每周一 09:00 自动执行（Linux）

```bash
sudo bash scripts/install-weekly-cron.sh
```

日志：`/var/log/custom-furniture-dispatch/weekly-digest.log`

### 4. API 说明

| 接口 | 作用 |
|------|------|
| `POST /api/weekly-digest/cron` | 读 snapshot → 生成周报 → 推企微 |
| `GET /api/weekly-digest/cron` | 仅生成预览（需 x-digest-key） |
| `POST /api/weekly-digest/push` | 推送已有 text 正文 |

鉴权头：`x-digest-key` 或 `x-sync-key`（与 `DIGEST_PUSH_KEY` / `SYNC_API_KEY` 一致）

### 5. 外网 cron（无 shell 时）

```bash
curl -X POST https://你的域名/api/weekly-digest/cron \
  -H "Content-Type: application/json" \
  -H "x-digest-key: your-secret" \
  -d "{}"
```

## 月度快照

- 评价看板 → 设计师绩效月报 →「保存本月快照」
- 数据存于 `data/monthly-snapshots/YYYY-MM.json`
- 用于与上月存档对比趋势
