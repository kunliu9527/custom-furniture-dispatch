# 首页数据助手

登录后首页「数据助手」：用大模型做**只读**问答。订单范围与首页 KPI 一致，随账号权限/岗位裁剪。

## 云端配置（阿里云 ECS / 国内服务器）

代码需已包含助手功能（`git pull` 后重新 `npm run build` 并重启 pm2）。然后在**服务器**项目目录改环境变量：

```bash
cd /opt/custom-furniture-dispatch   # 若你的目录不同，改成实际路径
nano .env.local
```

追加（DeepSeek 示例，可换成其它 OpenAI 兼容服务）：

```env
ASSISTANT_LLM_API_KEY=sk-你的密钥
ASSISTANT_LLM_BASE_URL=https://api.deepseek.com/v1
ASSISTANT_LLM_MODEL=deepseek-chat
```

保存后重启进程使变量生效：

```bash
pm2 restart dispatch --update-env
# 若进程名不是 dispatch，用：pm2 list 查看后替换
```

浏览器打开云端站点 → 登录 → 首页应出现「数据助手」。  
若仍显示「未配置大模型密钥」，多半是 `.env.local` 未写上或 pm2 未 `--update-env` 重启。

### 可选服务商

| 服务 | `ASSISTANT_LLM_BASE_URL` | `ASSISTANT_LLM_MODEL` 示例 |
|------|--------------------------|---------------------------|
| DeepSeek | `https://api.deepseek.com/v1` | `deepseek-chat` |
| 通义（兼容模式） | 按阿里云文档填写兼容 endpoint | 按控制台模型名 |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |

服务器需能访问该 API 域名（安全组出网一般默认放行）。

### Vercel

在 Vercel 项目 → Settings → Environment Variables 增加上述三项（Production），Redeploy。

---

## 环境变量说明

```env
ASSISTANT_LLM_API_KEY=你的密钥
ASSISTANT_LLM_BASE_URL=https://api.deepseek.com/v1
ASSISTANT_LLM_MODEL=deepseek-chat
# 可选；不设则用 SYNC_API_KEY
# ASSISTANT_HMAC_SECRET=
```

未配置 `ASSISTANT_LLM_API_KEY` 时，面板会提示「未配置大模型密钥」，接口返回 503。

## 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/assistant/token` | 是否已配置 LLM |
| `POST` | `/api/assistant/token` | 用登录 session 的 `passwordRevision`（或密码）签发短期 token |
| `POST` | `/api/assistant/chat` | `{ token, message, history? }` → 按权限裁剪 snapshot 后问模型 |

## 权限层级（与系统一致）

- 管理员 / 总部设计经理·总经理：全站  
- 门店设计经理·店长等：所属门店  
- 本人权限设计师/派单人：本人相关订单  
- 验收经理：按其可见范围  

当前**不能**通过助手改单；后续若加写操作需二次确认与审计。
