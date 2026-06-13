# 东西方哲学史 · 可交互时间轴

> 中文优先的东西方哲学史交互可视化网站
> 🔗 在线访问：https://jane5256.github.io/philosophy-timeline/

把东方与西方的思想史**并排放在同一条时间轴**上，让"轴心时代孔子与苏格拉底几乎同框"这样的同期对照一眼可见；并支持向古今哲学家**追问人生母题**。

## ✨ 功能

- **东西并行时间轴**：流派色带 + 哲学家头像节点，纵向贯通；中轴年代游标可拖动。
- **同期对照**：游标命中某年，右侧展示东西方当时在世的思想家与一句同期画面。
- **人生母题追问**：输入任意人生困惑，由大模型选 3–5 位哲学家以各自口吻作答（含流派、观点、出处），左侧时间轴对应节点高亮联动。
- **三层渐进交互**：默认极简 → 点流派看抽屉 → 点人物看详情；支持搜索、缩放、全览、响应式。

## 🛠 技术栈

- 前端：React + Vite + TypeScript + D3（纯 CSS 样式/动效）
- 人生问题后端：Cloudflare Worker（密钥代理）→ 硅基流动 DeepSeek-V3
- 部署：GitHub Pages + GitHub Actions（push `main` 自动构建上线）

## 📁 目录结构

```
Philosophy Timeline/
├── app/                   # 前端（Vite + React + TS）
│   ├── src/               # 组件 / 数据 / 工具
│   ├── scripts/           # sync-data.mjs：把 data/ 的 json 同步进 src/data
│   └── public/            # 静态资源（logo / 哲学家画像）
├── data/                  # 内容数据
│   ├── structured/        # *.md 源 → convert.py → *.json（站点数据源）
│   └── convert.py         # MD → JSON 转换脚本
├── worker/                # Cloudflare Worker（人生问题 LLM 代理）
├── docs/                  # 技术与设计文档（数据规范、交互设计原则）
└── .github/workflows/     # 部署工作流
```

## 🚀 本地开发

```bash
cd app
npm install
npm run dev        # http://localhost:5173/
```

> 人生问题功能需配置后端：复制 `app/.env.example` 为 `.env.local` 填入 Worker 地址；
> Worker 部署见 `worker/README.md`。未配置时该功能走本地 mock。

## 📝 数据扩展

内容数据走「Markdown 源 → 脚本转换 → 前端自动同步」管线，**只需编辑 Markdown**：

1. 编辑 `data/structured/philosophers.md`（或 `schools.md` / `events.md` 等）
2. 运行 `python3 data/convert.py` 生成同名 `.json`
3. `npm run dev` / `npm run build` 会自动把数据同步进前端

字段规范见 `docs/data-schema.md`。
