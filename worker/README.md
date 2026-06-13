# 人生母题追问 · 后端 Worker

密钥代理：前端 → 本 Worker（藏 API key）→ 硅基流动。网站仍部署在 GitHub Pages，本 Worker 是独立的一个 API 端点，互不影响。

```
前端(GitHub Pages)
   │ POST { question }
   ▼
philosophy-ask.<子域>.workers.dev   ← 本 Worker，藏 SILICONFLOW_API_KEY
   │ 拼 prompt + 94 位哲学家名单
   ▼
硅基流动 OpenAI 兼容接口
   │ 返回结构化 JSON { answers:[{philosopherId,view,citation}] }
   ▼
前端按 id 渲染卡片 + 左侧时间轴节点高亮
```

## 一次性准备

### 1. 注册硅基流动，拿 API key
- 打开 https://siliconflow.cn ，注册登录。
- 控制台 → API 密钥 → 新建，复制 key（形如 `sk-xxxx`）。
- 顺便在「模型广场」确认 `wrangler.toml` 里的 `MODEL` 仍是免费可用模型；若不是，改成当前的免费模型名（如某个标「免费」的 Qwen / GLM）。

### 2. 注册 Cloudflare（免费）
- 打开 https://dash.cloudflare.com/sign-up 注册即可，无需绑卡。

## 部署（在本目录 `06-worker/` 下执行）

```bash
# 装依赖（本地 wrangler）
npm install

# 登录 Cloudflare（会打开浏览器授权）—— 终端里建议用 ! 前缀运行
npx wrangler login

# 注入硅基流动密钥（粘贴上面的 sk-xxxx，回车）
npx wrangler secret put SILICONFLOW_API_KEY

# 生成名单 + 部署
npm run deploy
```

部署成功后终端会打印 Worker 地址，形如：
```
https://philosophy-ask.<你的子域>.workers.dev
```

## 让前端用上它

本地开发：把地址填进 `app/.env.local`（没有就照 `.env.example` 新建，`.local` 已 gitignore 不会上传）：

```
VITE_ASK_API=https://philosophy-ask.<你的子域>.workers.dev
```

然后 `cd app && npm run dev` 本地验证。
> 线上（GitHub Pages）已通过提交版的 `app/.env.production` 注入同一地址，Vite build 时自动加载，push `main` 即生效。URL 非机密（VITE_ 变量本就内联进前端包），key 安全在 Cloudflare。

## 自测

```bash
curl -X POST https://philosophy-ask.<子域>.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"question":"该不该躺平？"}'
```
应返回 `{"answers":[{"philosopherId":"...","view":"...","citation":"..."}]}`。

## 数据更新后

哲学家数据有增改时，重跑 `npm run deploy`（内含 `gen-roster.mjs`）即可同步名单。

## 换模型 / 升级

改 `wrangler.toml` 的 `MODEL` 再 `npm run deploy`。想要更聪明的回答，把 key 换成 DeepSeek 的、`MODEL` 改 `deepseek-ai/DeepSeek-V3`，并把 `worker.js` 里的 `SILICONFLOW_URL` 改成 DeepSeek 的接口地址即可（同为 OpenAI 兼容）。
