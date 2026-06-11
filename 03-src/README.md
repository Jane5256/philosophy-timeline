# 前端 · 东西方思想对照时间轴

React + Vite + TypeScript。数据来自 `../02-data/structured/`，由 `scripts/sync-data.mjs` 在 dev/build 前自动同步到 `src/data/`（**单一数据源是 02-data，不要手改 src/data**）。

## 运行

```bash
npm install          # 首次
npm run dev          # 开发，http://localhost:5173/
npm run build        # 生产打包到 dist/
npm run preview      # 本地预览打包结果
```

> 从项目根目录也可用 `--prefix 03-src`，例如 `npm run dev --prefix 03-src`。

## 改数据后

改 `02-data/structured/*.md` → 在 02-data 跑 `python3 convert.py` 重新生成 JSON → 前端 dev/build 会自动同步。

## 结构

```
src/
├── data/            # 自动同步（勿手改）
├── types.ts         # 数据类型
├── data.ts          # 载入 JSON + 索引
├── lib/timeline.ts  # 年代↔坐标、泳道分配、同期计算
├── components/
│   ├── Timeline.tsx         # 主画布：年代尺/朝代轨/色带/节点/游标
│   ├── SyncPanel.tsx        # 同期对照面板
│   ├── PhilosopherModal.tsx # 人物详情(L3)
│   └── SchoolDrawer.tsx     # 流派详情(L2)
└── App.tsx          # 组装 + 导航 + 状态
```
