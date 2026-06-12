# 东西方哲学史 · 可交互时间轴

> 以西方哲学史为内容核心的中文交互式可视化网站 https://jane5256.github.io/philosophy-timeline/

---

## 目录结构

```
Philosophy Timeline/
│
├── 01-product/                  # 产品规划
│   ├── research/
│   │   ├── competitive-analysis.md    # 竞品分析
│   │   └── prd.md                     # 产品需求文档
│   └── design/
│       └── visual-styles.md           # 视觉风格方案（三选一）
│
├── 02-data/                     # 数据层
│   ├── raw/
│   │   ├── 西方哲学历史时间线.pdf      # 原始信息图
│   │   └── extracted_text.txt         # PDF 提取的原始文字
│   ├── structured/              # 结构化 JSON 数据（内容核心）
│   │   ├── eras.json
│   │   ├── schools.json
│   │   ├── philosophers.json
│   │   ├── events.json
│   │   └── relations.json       # P2 阶段启用
│   └── assets/
│       ├── portraits/           # 哲学家画像（备用本地缓存）
│       └── maps/                # 历史地图图片
│
├── 03-src/                      # 前端源代码
│   ├── components/              # UI 组件
│   ├── pages/                   # 页面
│   ├── styles/                  # 样式
│   ├── hooks/                   # React Hooks
│   └── utils/                   # 工具函数
│
├── 04-design/                   # 设计稿
│   ├── mockups/                 # 页面线框图 / 高保真稿
│   └── style-guide/             # 设计规范（色板、字体、组件）
│
└── 05-docs/                     # 技术文档
    └── data-schema.md           # 数据结构规范
```

---

## 当前进度

| 阶段 | 状态 | 说明 |
|------|------|------|
| 竞品分析 | ✅ 完成 | `01-product/research/competitive-analysis.md` |
| 需求文档 | ✅ 完成 | `01-product/research/prd.md` |
| 视觉风格 | ⏳ 待选择 | `01-product/design/visual-styles.md`（三选一） |
| 数据结构规范 | ✅ 完成 | `05-docs/data-schema.md` |
| 数据整理 | ⏳ 待开始 | 视觉风格确认后开始 |
| UI 开发 | ⏳ 待开始 | 数据整理完成后开始 |

---

## 快速开始

> 开发环境搭建说明（待补充，开发阶段开始后更新）

---

## 数据扩展

新增哲学家：在 `02-data/structured/philosophers.json` 追加对象
新增流派：在 `02-data/structured/schools.json` 追加对象
字段规范：见 `05-docs/data-schema.md`
