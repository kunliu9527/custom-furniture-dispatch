# 国内云服务器部署（方案 B）

适合：**中国大陆**门店通过公网 IP 或域名访问，不依赖 Vercel。

推荐：**腾讯云轻量应用服务器（Lighthouse）** 或 **阿里云 ECS**，系统选 **Ubuntu 22.04**。

---

## 一、购买与放行端口

### 1. 购买服务器

- 配置：1 核 2G、3M 带宽即可起步  
- 系统：**Ubuntu 22.04 LTS**  
- 地域：选离门店近的（如 **广州 / 上海 / 北京**）  
- 记下：**公网 IP**（例如 `123.45.67.89`）

### 2. 防火墙 / 安全组（必做）

在云平台控制台放行：

| 端口 | 用途 |
|------|------|
| 22 | SSH 远程登录 |
| 80 | 网站 HTTP |
| 443 | HTTPS（绑域名后） |

腾讯云：**防火墙** → 添加规则  
阿里云：**安全组** → 入方向规则  

---

## 二、首次登录服务器

Windows 可用 **PowerShell** 或 **PuTTY**：

```powershell
ssh root@你的公网IP
```

（密码或密钥以云厂商控制台为准。）

---

## 三、一键安装（推荐）

登录服务器后执行（把仓库地址换成你的）：

```bash
export GIT_REPO="https://github.com/kunliu9527/custom-furniture-dispatch.git"
export APP_DIR="/opt/custom-furniture-dispatch"
export SYNC_API_KEY="请改成复杂密码"

curl -fsSL https://raw.githubusercontent.com/kunliu9527/custom-furniture-dispatch/main/scripts/install-server.sh -o /tmp/install-server.sh
bash /tmp/install-server.sh
```

若 GitHub 拉脚本失败，可在本机把项目里的 `scripts/install-server.sh` 上传到服务器再执行：

```bash
bash install-server.sh
```

---

## 四、手动安装（分步）

### 1. 安装 Node.js 20 与 PM2

```bash
apt update && apt install -y git curl
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm install -g pm2
node -v   # 应 v20.x
```

### 2. 拉取代码

```bash
mkdir -p /opt
cd /opt
git clone https://github.com/kunliu9527/custom-furniture-dispatch.git
cd custom-furniture-dispatch
npm install
```

### 3. 配置环境变量

```bash
cp deploy/env.production.example .env.local
nano .env.local
```

至少修改：

```env
NEXT_PUBLIC_REMOTE_SYNC=true
SYNC_API_KEY=你的复杂密码
NEXT_PUBLIC_SYNC_API_KEY=同上
SYNC_STORAGE=file
SYNC_DATA_DIR=/var/lib/custom-furniture-dispatch
```

保存后：

```bash
mkdir -p /var/lib/custom-furniture-dispatch
```

### 4. 构建并启动

```bash
npm run build
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup
```

按 `pm2 startup` 提示再执行一行命令，实现开机自启。

### 5. 配置 Nginx（80 端口访问）

```bash
apt install -y nginx
cp deploy/nginx.conf.example /etc/nginx/sites-available/dispatch
nano /etc/nginx/sites-available/dispatch
# 把 server_name 改成你的 IP 或域名
ln -sf /etc/nginx/sites-available/dispatch /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

---

## 五、门店电脑如何使用

浏览器打开：

```text
http://你的公网IP
```

（若已绑域名并配 HTTPS：`https://你的域名`）

- 所有人用 **同一地址**  
- 导航栏应显示 **「云端同步」**  
- 登录账号派单，其他电脑刷新即可看到  

---

## 六、更新程序

代码 push 到 GitHub 后，在服务器执行：

```bash
cd /opt/custom-furniture-dispatch
bash scripts/deploy-update.sh
```

---

## 七、备份

定期备份订单数据：

```bash
cp /var/lib/custom-furniture-dispatch/snapshot.json ~/snapshot-backup-$(date +%F).json
```

---

## 八、常见问题

| 现象 | 处理 |
|------|------|
| 外网打不开 | 检查安全组是否放行 80；`pm2 status` 是否在跑 |
| 显示「本机存储」 | `.env.local` 里 `NEXT_PUBLIC_REMOTE_SYNC=true` 后重新 `npm run build` 并 `pm2 restart dispatch` |
| 显示「同步异常」 | 检查 `data` 目录权限；`SYNC_DATA_DIR` 是否可写 |
| git clone 失败 | 服务器访问 GitHub 不稳定，可用本机打包上传 zip |

---

## 与 Vercel 方案对比

| | Vercel | 国内云（本方案） |
|--|--------|------------------|
| 大陆访问 | 常不稳定 | 稳定 |
| 数据存储 | Redis | 服务器磁盘 `snapshot.json` |
| 费用 | 免费额度 | 约 ¥50–100/月 轻量服务器 |

Vercel 上已配的 Redis **可保留**；国内服务器用 **文件存储** 即可，无需再配 Upstash。
