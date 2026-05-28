# 阿里云启用 HTTPS（让访问更稳定、更安全）

## 先说明两件事

| 方式 | 能否用 HTTPS | 稳定性 |
|------|-------------|--------|
| 只用 IP：`http://121.199.20.177` | **不能**申请正规免费证书 | 功能上已修复，HTTP 也能保存人员/派单 |
| **有域名**：`https://dispatch.你的域名.com` | **可以**（推荐） | 浏览器信任、密码加密、长期更稳 |

正规免费证书（Let's Encrypt）**必须绑定域名**，不能给纯 IP 签发。

---

## 方案一：域名 + 免费证书（推荐）

### 第 1 步：准备域名

1. 在阿里云（或任意注册商）购买一个域名，例如 `yourcompany.com`
2. 若服务器在**中国大陆**且要对国内用户用域名访问，通常需要 **[ICP 备案](https://beian.aliyun.com/)**（约 1～2 周）
3. 未备案时：可先用域名 + HTTPS 给内部试用，或解析到海外节点（本教程按大陆 ECS + 备案后使用）

### 第 2 步：DNS 解析

阿里云 **云解析 DNS** → 添加记录：

| 类型 | 主机记录 | 记录值 |
|------|----------|--------|
| A | `dispatch`（或 `@`） | `121.199.20.177`（你的 ECS 公网 IP） |

等待几分钟，本机测试：

```bash
ping dispatch.你的域名.com
```

### 第 3 步：安全组放行 443

与 80 端口一样，在安全组 **入方向** 增加：

| 端口 | 协议 | 授权对象 |
|------|------|----------|
| 443 | TCP | 0.0.0.0/0 |

### 第 4 步：在服务器安装 Certbot 并申请证书

SSH / Workbench 登录 Ubuntu 后执行：

```bash
apt update
apt install -y certbot python3-certbot-nginx

# 把域名改成你的
certbot --nginx -d dispatch.你的域名.com
```

按提示：

1. 输入邮箱（用于证书到期提醒）
2. 同意条款
3. 是否重定向 HTTP→HTTPS：选 **2（Redirect）** 推荐

成功后 Nginx 会自动改成 HTTPS，证书约 **90 天** 自动续期。

### 第 5 步：验证

浏览器打开：

```text
https://dispatch.你的域名.com
```

地址栏应有 **锁图标**，导航栏「云端同步」正常。

### 第 6 步：自动续期（一般已配置）

```bash
certbot renew --dry-run
```

无报错即续期正常。

---

## 方案二：阿里云 SSL 证书（控制台上传）

适合不想用命令行的场景：

1. 阿里云控制台 → **SSL 证书** → 购买/申请 **免费 DV 证书**（单域名）
2. 按指引完成 **DNS 验证**
3. 下载 **Nginx** 格式证书（`.pem` + `.key`）
4. 上传到服务器，例如 `/etc/nginx/ssl/`
5. 修改 Nginx 配置（可参考 `deploy/nginx-https.conf.example`）
6. `nginx -t && systemctl reload nginx`

---

## 方案三：暂时继续用 HTTP（已修复核心问题）

若暂时没有域名/备案：

1. 在服务器更新代码（含 `create-id` 修复）：

```bash
cd /opt/custom-furniture-dispatch
git pull
npm run build
pm2 restart dispatch
```

2. 继续用 `http://公网IP` 访问  
3. **保存人员、派单** 在 HTTP 下应已正常  
4. 密码在网络上是**明文传输**，仅适合内网或临时试用；正式对外仍建议尽快上 HTTPS

---

## Nginx HTTPS 配置参考（手动证书时）

项目内：`deploy/nginx-https.conf.example`  
将 `server_name`、证书路径改成你的域名和证书文件路径。

---

## 常见问题

**Q：必须用 HTTPS 才能云端同步吗？**  
A：不需要。云端同步看 `NEXT_PUBLIC_REMOTE_SYNC` 和 `/api/sync`，HTTP 即可。

**Q：证书申请失败？**  
A：确认域名已解析到本机公网 IP、安全组已放行 80/443、Nginx 80 端口可被外网访问（Let's Encrypt 要验证域名）。

**Q：备案期间怎么办？**  
A：先用 IP + HTTP 试用；或备案完成后再绑域名上 HTTPS。

---

## 推荐路线

```
现在：git pull + pm2 restart（HTTP 已可正常用）
  ↓
购买域名 + 备案（进行中可并行）
  ↓
certbot --nginx -d 你的域名
  ↓
全员改用 https://你的域名 访问
```
