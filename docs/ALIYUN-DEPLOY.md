# 阿里云 ECS 部署派单系统（分步操作）

适用于你的实例：**公网 IP `121.199.20.177`**（以控制台实际显示为准）。

当前若是 **Windows Server**，需先 **更换为 Ubuntu 22.04**（见第二步）。本项目的自动安装脚本仅支持 Linux。

---

## 第一步：启动实例

1. 登录 [阿里云控制台](https://ecs.console.aliyun.com/)
2. 左侧 **实例与镜像 → 实例**
3. 找到你的 ECS，状态为 **已停止**
4. 点击 **启动** → 等待 1～2 分钟，状态变为 **运行中**

---

## 第二步：更换为 Ubuntu 22.04（当前是 Windows 必做）

> 更换系统盘会 **清空系统盘数据**，不影响数据盘（若有）。

1. 实例状态为 **已停止** 时操作（若正在运行，先 **停止**）
2. 在实例行点击 **更多** → **磁盘和镜像** → **更换系统盘**（或 **重装系统**）
3. **镜像类型**：公共镜像  
4. 选择 **Ubuntu**，版本 **22.04 64位**
5. 确认 **40GiB** 系统盘即可
6. 勾选协议 → **确认更换**
7. 等待 3～5 分钟，实例自动 **运行中**

### 设置登录密码

1. 实例 **运行中** 后，点击 **重置密码**
2. 设置 **root** 或提示的用户名密码（记住密码）
3. 按提示 **重启** 实例使密码生效

---

## 第三步：配置安全组（放行网站端口）

1. 实例详情页 → **安全组** 标签 → 点击安全组 ID
2. **入方向** → **手动添加**，添加以下规则：

| 授权策略 | 端口 | 协议 | 授权对象 | 说明 |
|----------|------|------|----------|------|
| 允许 | 22 | TCP | 0.0.0.0/0 | SSH（维护用，可 later 改为你办公室 IP） |
| 允许 | 80 | TCP | 0.0.0.0/0 | 网站 HTTP |
| 允许 | 443 | TCP | 0.0.0.0/0 | HTTPS（绑域名后用） |

3. 保存

> 若仍无法访问，检查实例是否绑定该安全组；**防火墙** 页确认未额外拦截。

---

## 第四步：远程登录服务器

### 方式 A：浏览器（简单）

1. 实例列表 → **远程连接**
2. 选 **Workbench 远程连接** → 连接 **Linux** 实例
3. 输入用户名 **root** 和密码

### 方式 B：本机 PowerShell

```powershell
ssh root@121.199.20.177
```

（IP 换成控制台显示的公网 IP；首次连接输入 `yes` 和密码。）

---

## 第五步：一键安装派单系统

登录 Ubuntu 后，**逐行执行**（先改密码）：

```bash
export SYNC_API_KEY="请改成你的复杂密码"
export GIT_REPO="https://github.com/kunliu9527/custom-furniture-dispatch.git"
export APP_DIR="/opt/custom-furniture-dispatch"
export SERVER_NAME="121.199.20.177"
```

安装 Git 并拉取代码（若 GitHub 较慢，见文末「GitHub 拉不动」）：

```bash
apt update && apt install -y git
git clone "$GIT_REPO" "$APP_DIR"
cd "$APP_DIR"
bash scripts/install-server.sh
```

安装过程约 **5～15 分钟**（含 Node.js、构建）。结束时终端会提示访问地址。

---

## 第六步：浏览器访问

在任意门店电脑浏览器打开：

```text
http://121.199.20.177
```

检查：

- 能打开「设计师超级定单系统」首页  
- 右上角 **「云端同步」**（绿色）  
- 登录后能派单，另一台电脑同网址能看到订单  

---

## 第七步：日常管理命令

```bash
# 查看是否在跑
pm2 status

# 看日志
pm2 logs dispatch

# 重启
pm2 restart dispatch
```

代码更新后（GitHub 已 push 新代码）：

```bash
cd /opt/custom-furniture-dispatch
bash scripts/deploy-update.sh
```

---

## 费用与试用说明

- 控制台显示 **按量付费** 时，以 **费用中心 → 账单 / 代金券** 为准是否抵扣试用金。
- 实例 **已停止** 仍可能收部分费用（磁盘、公网 IP 等），不用时可 **停止** 或释放实例。
- 2GiB 内存可运行本系统；订单量很大时再升配。

---

## 常见问题

### 1. 打不开 http://公网IP

- 实例是否 **运行中**
- 安全组是否放行 **80**
- 服务器上执行：`pm2 status`、`curl -I http://127.0.0.1:3000`

### 2. 显示「本机存储」而不是「云端同步」

```bash
cd /opt/custom-furniture-dispatch
nano .env.local
```

确认：

```env
NEXT_PUBLIC_REMOTE_SYNC=true
SYNC_API_KEY=你的密码
NEXT_PUBLIC_SYNC_API_KEY=同上
```

保存后：

```bash
npm run build
pm2 restart dispatch
```

### 3. GitHub 拉不动 / clone 失败

在本机 Windows 把项目打成 zip，通过 Workbench **上传** 到 `/opt/custom-furniture-dispatch`，解压后：

```bash
cd /opt/custom-furniture-dispatch
export SYNC_API_KEY="你的密码"
bash scripts/install-server.sh
```

（若目录已有文件，脚本会尝试 `git pull` 或覆盖安装。）

### 4. 想绑自己的域名

1. 域名 DNS **A 记录** 指向 `121.199.20.177`
2. 修改 Nginx：`nano /etc/nginx/sites-available/dispatch`，`server_name` 改为你的域名
3. `nginx -t && systemctl reload nginx`
4. 可用 **certbot** 申请免费 HTTPS（需域名已备案，按阿里云政策）

---

## 相关文档

- 通用说明：[CHINA-SERVER-DEPLOY.md](./CHINA-SERVER-DEPLOY.md)
- 环境变量示例：[deploy/env.production.example](../deploy/env.production.example)
