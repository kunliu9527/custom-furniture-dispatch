# Vercel 部署指南（互联网派单 · 分步操作）

按顺序完成以下步骤后，任意地方的电脑用浏览器打开 **同一个 Vercel 网址** 即可共享派单数据。

---

## 第 0 步：准备

- 一个 [GitHub](https://github.com) 账号  
- 一个 [Vercel](https://vercel.com) 账号（可用 GitHub 登录）  
- 本项目代码已在你的电脑上（当前文件夹）

---

## 第 1 步：把代码放到 GitHub

1. 在 GitHub 新建仓库（例如 `custom-furniture-dispatch`），**不要**勾选 “Add a README”（若本地已有代码）。  
2. 在本项目文件夹打开终端，执行（把地址换成你的仓库）：

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/custom-furniture-dispatch.git
git push -u origin main
```

> 若已有 git 仓库，只需 `git push` 到 GitHub。

---

## 第 2 步：在 Vercel 导入项目

1. 打开 [vercel.com/new](https://vercel.com/new)  
2. 选择 **Import** 你的 GitHub 仓库  
3. **Framework Preset** 保持 **Next.js**（自动识别）  
4. 先不要点 Deploy，继续第 3 步配置存储和环境变量  

---

## 第 3 步：创建 Redis 数据库（存所有订单）

Vercel 上不能用本机 `data/snapshot.json`，要用 **Upstash Redis**：

1. 在 Vercel 项目页或团队页打开 **Storage**（存储）  
2. 点击 **Create Database** → 选择 **Upstash** → **Redis**  
3. 取名（如 `dispatch-redis`）→ 区域选离用户近的（如 `ap-southeast-1`）  
4. 创建后点击 **Connect to Project**，选中刚导入的 Next.js 项目  

连接成功后，项目会自动增加环境变量（无需手抄）：

- `UPSTASH_REDIS_REST_URL`  
- `UPSTASH_REDIS_REST_TOKEN`  

（可能仍有旧的 `KV_REST_API_*`，也可兼容。）

---

## 第 4 步：配置环境变量

在 Vercel 项目 → **Settings** → **Environment Variables**，添加：

| 名称 | 值 | 环境 |
|------|-----|------|
| `NEXT_PUBLIC_REMOTE_SYNC` | `true` | Production, Preview, Development |
| `SYNC_API_KEY` | 自拟一串复杂密码 | Production, Preview, Development |
| `NEXT_PUBLIC_SYNC_API_KEY` | **与上面相同** | Production, Preview, Development |

说明：

- `NEXT_PUBLIC_REMOTE_SYNC=true` 才会走云端同步（导航栏显示「云端同步」）。  
- 两个 `SYNC_API_KEY` 防止陌生人篡改你的订单数据，请用长随机字符串。

---

## 第 5 步：部署

1. 回到 **Deployments** → **Deploy**（或 Push 代码后自动部署）  
2. 等待构建成功（约 1～3 分钟）  
3. 打开分配的地址，例如：`https://custom-furniture-dispatch.vercel.app`  

**所有门店 / 设计师 / 派单人都用这个网址登录使用。**

---

## 第 6 步：验证是否成功

1. 用浏览器打开你的 Vercel 网址  
2. 右上角应显示 **「云端同步」**（绿色）  
3. 登录后派一单 → 换另一台电脑或手机浏览器打开**同一网址** → 应能看到该订单  

若显示 **「同步异常」**：

- 检查 Redis 是否已 **Connect to Project**  
- 检查 `NEXT_PUBLIC_REMOTE_SYNC` 是否为 `true`  
- 在 Vercel → Deployments → 最新部署 → **Functions** → 查看 `/api/sync` 报错日志  

---

## 本地开发（可选，连接线上 Redis）

1. 安装 Vercel CLI：`npm i -g vercel`  
2. 在项目目录：`vercel link` 关联你的 Vercel 项目  
3. `vercel env pull .env.local` 拉取环境变量  
4. 确认 `.env.local` 含 `NEXT_PUBLIC_REMOTE_SYNC=true` 和 Redis 变量  
5. `npm run dev`  

此时本机 `localhost:3000` 与线上共用同一份 Redis 数据（慎用，会改生产数据）。

---

## 自定义域名（可选）

Vercel 项目 → **Settings** → **Domains** → 添加你的域名并按提示解析 DNS。

---

## 与本机当主机的区别

| | 本机 + 文件 | Vercel + Redis |
|--|------------|----------------|
| 电脑要常开 | 要 | 不要 |
| 互联网访问 | 需 ngrok 等 | 自带 HTTPS 网址 |
| 数据位置 | `data/snapshot.json` | Upstash Redis |

---

## 常见问题

**Q：部署后每人数据还是不一样？**  
A：确认大家都访问 **同一个 Vercel 域名**，且不是各自的 `localhost`。

**Q：免费够用吗？**  
A：门店日常派单量一般够用；具体以 Vercel / Upstash 当前免费额度为准。

**Q：如何备份？**  
A：可在 Upstash 控制台查看数据；重要数据建议定期从「管理员」导出或后续增加导出功能。

---

完成以上步骤即完成 **Vercel 互联网派单** 配置。若某一步报错，把 Vercel 构建日志或 `/api/sync` 错误信息发出来即可继续排查。
