# 多电脑互联网派单（云端同步）

> **推荐无局域网、长期用互联网：** 请直接看 **[Vercel 部署分步指南](./VERCEL-DEPLOY.md)**。

本系统默认数据存在**每台电脑自己的浏览器**里。开启云端同步后，所有电脑访问**同一个网站地址**，共享同一份订单与人员配置。

## 架构说明

```
电脑 A（浏览器） ──┐
电脑 B（浏览器） ──┼──> https://你的域名  (Next.js)
电脑 C（浏览器） ──┘         │
                             ▼
                    data/snapshot.json（服务器磁盘）
```

- 导航栏会显示 **「云端同步」** 状态
- 约每 8 秒自动拉取其他电脑的更新
- 本机修改后约 0.5 秒上传到服务器

## 一、在服务器上部署（只需一台）

### 1. 准备一台可被外网访问的机器

- 云服务器（阿里云 / 腾讯云等），或
- 公司内网一台固定 IP 的电脑（同事通过内网访问）

### 2. 安装 Node.js 20+

### 3. 上传项目并安装依赖

```bash
cd custom-furniture-dispatch
npm install
npm run build
```

### 4. 配置环境变量

复制 `.env.example` 为 `.env.local`：

```bash
NEXT_PUBLIC_REMOTE_SYNC=true
SYNC_API_KEY=请改成复杂随机字符串
NEXT_PUBLIC_SYNC_API_KEY=与上面相同
```

> `SYNC_API_KEY` 防止陌生人篡改数据，前后端密钥必须一致。

### 5. 启动服务

```bash
npm run start
```

默认端口 **3000**。生产环境建议用 Nginx 反向代理并配置 **HTTPS**。

数据文件保存在项目目录 `data/snapshot.json`（首次启动自动创建）。

## 二、各门店电脑如何使用

1. 浏览器打开：`http://服务器IP:3000` 或 `https://你的域名`
2. 各自登录账号（账号密码以服务器上的数据为准）
3. 派单、改状态后，其他电脑几秒内可见

**不要**再各自用 `localhost` 各玩各的数据；所有人必须访问**同一个地址**。

## 三、从本机数据迁移到服务器

若某台电脑 `localStorage` 里已有最新数据：

1. 先在该电脑**不要**开 `NEXT_PUBLIC_REMOTE_SYNC`，记下数据
2. 在服务器开启同步并启动
3. 在该电脑也配置 `NEXT_PUBLIC_REMOTE_SYNC=true` 并访问服务器地址
4. 在服务器电脑上打开一次页面，或临时把该电脑的 `localStorage` 导出后由管理员导入（需自行用浏览器开发者工具导出；后续可做导入工具）

首次连接时，若服务器 `data/snapshot.json` 为空，会使用系统内置示例数据；之后以服务器为准。

## 四、关闭云端（恢复单机）

`.env.local` 中设置：

```
NEXT_PUBLIC_REMOTE_SYNC=false
```

重新 `npm run build && npm run start`，各电脑恢复仅本机 `localStorage`。

## 五、局限与注意

| 项目 | 说明 |
|------|------|
| 并发 | 两人同时改同一订单，后保存者覆盖（最后写入优先） |
| 备份 | 请定期备份 `data/snapshot.json` |
| 规模 | 适合单店 / 多店中小数据量；大数据量建议改用数据库方案 |
| 安全 | 务必设置 `SYNC_API_KEY` 并启用 HTTPS |

## 六、开发调试

```bash
# .env.local
NEXT_PUBLIC_REMOTE_SYNC=true

npm run dev
```

两台浏览器访问 `http://localhost:3000`，可验证同步。
