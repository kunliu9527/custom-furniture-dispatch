# 任意电脑本地安装

派单系统可安装在 **Windows / macOS / Linux** 本机，数据保存在本地 `data/` 目录，无需云服务器。

---

## 方式一：发布包（推荐，复制即用）

在一台已安装 Node.js 的电脑上打包：

```powershell
cd custom-furniture-dispatch
npm install
npm run pack
```

产出目录：

- `release/custom-furniture-dispatch/` — 完整文件夹
- `release/custom-furniture-dispatch.zip` — Windows 自动生成的压缩包（可 U 盘 / 微信传给别人）

### 目标电脑安装步骤

1. **安装 Node.js 20+**  
   - Windows：`winget install OpenJS.NodeJS.LTS` 或 [nodejs.org](https://nodejs.org/)  
   - macOS：`brew install node@20`  
   - Linux：见 [NodeSource](https://github.com/nodesource/distributions)

2. **解压** `custom-furniture-dispatch.zip` 到任意目录（如 `D:\dispatch`）

3. **配置密码**（首次）  
   复制 `deploy/env.local.example` 为 `.env.local`，修改 `SYNC_API_KEY`（同步密钥，需与浏览器端一致）

4. **启动**  
   - Windows：双击 `scripts/start-dispatch.bat`  
   - macOS / Linux：`bash scripts/start-dispatch.sh`

5. 浏览器打开 **http://localhost:3000**

### 局域网多人访问

同一办公室其他电脑可通过 `http://安装机IP:3000` 访问。  
Windows 防火墙需放行 **3000** 端口（首次启动时按提示允许即可）。

---

## 方式二：一键安装脚本（从源码）

### Windows

```powershell
git clone https://github.com/kunliu9527/custom-furniture-dispatch.git
cd custom-furniture-dispatch
npm run install:local
```

脚本会：检测 Node.js、生成 `.env.local`、安装依赖、构建、在桌面创建「派单系统」快捷方式。

### macOS / Linux

```bash
git clone https://github.com/kunliu9527/custom-furniture-dispatch.git
cd custom-furniture-dispatch
bash scripts/install-local.sh
```

---

## 日常启动

| 平台 | 命令 |
|------|------|
| Windows | 双击桌面「派单系统」，或 `npm run start:local` |
| 通用 | `bash scripts/start-dispatch.sh` |

---

## 数据与备份

| 项目 | 说明 |
|------|------|
| 数据文件 | `data/snapshot.json`（订单、人员、配置） |
| 备份 | 定期复制整个 `data/` 文件夹 |
| 从云服务器迁回 | `npm run sync:pull http://服务器IP` |

---

## 与阿里云部署的区别

| | 本地安装 | 阿里云 |
|--|---------|--------|
| 适用 | 单店 / 内网 / 试用 | 多门店公网访问 |
| 数据 | 本机 `data/` | 服务器 `/var/lib/...` |
| 依赖 | 需 Node.js 20+ | 服务器 + Nginx + PM2 |

本地与云端 **不能自动双向同步**；需用 `sync:pull` 手动拉取或自行迁移 `snapshot.json`。

---

## 常见问题

**Q：没有 Node.js 怎么办？**  
A：必须安装 Node.js 20+。安装包体积已尽量精简（standalone 模式），但仍需 Node 运行。

**Q：能否做成 .exe 不用装 Node？**  
A：可用 Electron / Tauri 二次封装，体积较大（约 150MB+）。当前方案更轻量，适合办公室 PC。

**Q：开机自启？**  
A：Windows 可将 `start-dispatch.bat` 快捷方式放入「启动」文件夹；Linux 可用 systemd（见 `deploy/ecosystem.config.cjs` 参考）。
