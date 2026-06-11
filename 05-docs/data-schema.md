# 数据结构规范（Data Schema）
> 西方哲学史可交互可视化网站

版本：v0.1
日期：2026-06-04

---

## 概述

所有内容数据存放于 `02-data/structured/`。
数据与 UI 代码完全解耦——扩展内容只需编辑 `.md` 源文件后运行 `python3 convert.py` 重新生成 JSON，无需修改业务逻辑。

```
02-data/structured/
├── eras.json              # 时代分期（手工维护，不经 convert.py）
├── schools.json           # 哲学流派 ← schools.md + schools-east.md
├── philosophers.json      # 哲学家（核心文件） ← philosophers.md + philosophers-east.md
├── events.json            # 历史背景事件 ← events.md
└── relations.json         # 影响关系（P2 阶段启用）
```

### region 字段（东西方）

为支持东西方思想并行展示，`eras` / `schools` / `philosophers` 三类均含 `region` 字段：
- `"west"` — 西方哲学（缺省值，`.md` 中不写则默认 west）
- `"east"` — 东方思想（`.md` 中用 `- 地区：east` 标注，存于 `*-east.md` 文件）

东方时代 id：`pre-qin`（先秦）/ `qin-han`（秦汉）/ `wei-jin`（魏晋南北朝）/ `sui-tang`（隋唐）/ `song-yuan`（宋元）/ `ming-qing`（明清）/ `modern-china`（近现代）。

---

## 文件间依赖关系

```
eras.json
    ↑ era 字段引用
schools.json ──────────────────────────────┐
    ↑ school 字段引用                        │ id 被引用
philosophers.json                           │
  ├── school[]    → schools.json            │
  ├── era         → eras.json               │
  └── portrait    → 外部 URL（Wikipedia）    │
                                            │
events.json（独立，按 year 与时间轴关联）     │
                                            │
relations.json                              │
  ├── source      → philosophers.json       │
  └── target      → philosophers.json       │
```

---

## 1. eras.json — 时代分期

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 唯一标识（英文小写，用于其他文件引用） |
| `name` | string | ✅ | 中文名称 |
| `nameEn` | string | ✅ | 英文名称 |
| `start` | number | ✅ | 起始年份（负数为公元前） |
| `end` | number | ✅ | 结束年份 |
| `color` | string | ✅ | 十六进制颜色，用于时间轴背景 |

### 示例

```json
[
  {
    "id": "ancient",
    "name": "古代",
    "nameEn": "Ancient",
    "start": -600,
    "end": 500,
    "color": "#C8956C"
  },
  {
    "id": "medieval",
    "name": "中世纪",
    "nameEn": "Medieval",
    "start": 500,
    "end": 1400,
    "color": "#7A6E9E"
  },
  {
    "id": "early-modern",
    "name": "近代",
    "nameEn": "Early Modern",
    "start": 1400,
    "end": 1800,
    "color": "#5A9E7A"
  },
  {
    "id": "modern",
    "name": "现代",
    "nameEn": "Modern",
    "start": 1800,
    "end": 2000,
    "color": "#4A7AAE"
  }
]
```

---

## 2. schools.json — 哲学流派

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 唯一标识 |
| `name` | string | ✅ | 中文名称 |
| `nameEn` | string | ✅ | 英文名称 |
| `alternateNames` | string[] | ❌ | 别名列表（如「伊奥尼亚学派」） |
| `era` | string | ✅ | 所属时代 id（引用 eras.json） |
| `start` | number | ✅ | 流派活跃起始年份 |
| `end` | number | ✅ | 流派活跃结束年份 |
| `color` | string | ✅ | 流派专属色（时间轴色带） |
| `description` | string | ✅ | 流派简介（中文） |
| `coreThemes` | string[] | ✅ | 核心议题标签（3-5 个） |
| `representativePhilosophers` | string[] | ✅ | 代表哲学家 id 列表 |

### 示例

```json
[
  {
    "id": "milesian",
    "name": "米利都学派",
    "nameEn": "Milesian School",
    "alternateNames": ["伊奥尼亚学派", "Ionian School"],
    "era": "ancient",
    "start": -624,
    "end": -480,
    "color": "#E8A87C",
    "description": "亦称伊奥尼亚学派，产生于贸易港口米利都。探求万物的本源（arché），是西方最早的自然哲学流派，开创了以理性而非神话解释自然的传统。",
    "coreThemes": ["万物本源", "自然主义", "宇宙论", "物质一元论"],
    "representativePhilosophers": ["thales", "anaximander", "anaximenes"]
  }
]
```

---

## 3. philosophers.json — 哲学家（核心文件）

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 唯一标识（英文小写，用于关系引用） |
| `name` | string | ✅ | 中文名 |
| `nameEn` | string | ✅ | 英文名 |
| `born` | number | ✅ | 出生年份（负数为公元前） |
| `died` | number | ✅ | 死亡年份（负数为公元前） |
| `bornApprox` | boolean | ✅ | 出生年份是否为近似值 |
| `diedApprox` | boolean | ✅ | 死亡年份是否为近似值 |
| `nationality` | string | ✅ | 国籍/地区（中文，如「古希腊」「法国」） |
| `type` | string | ✅ | 人物类型：`philosopher` / `scientist` / `writer` / `theologian` |
| `school` | string[] | ✅ | 所属流派 id 列表（支持多个） |
| `era` | string | ✅ | 所属时代 id |
| `portrait.url` | string | ✅ | 画像图片 URL |
| `portrait.source` | string | ✅ | 图像来源（如 `Wikipedia`） |
| `portrait.license` | string | ✅ | 版权信息（如 `Public Domain`） |
| `summary` | string | ✅ | 一句话简介，用于节点卡片预览（≤50字） |
| `coreIdeas` | string[] | ✅ | 核心哲学观点，每条一句话（3-5条） |
| `majorWorks` | object[] | ✅ | 代表作列表 |
| `majorWorks[].title` | string | ✅ | 中文书名 |
| `majorWorks[].titleEn` | string | ✅ | 英文书名 |
| `majorWorks[].year` | number | ❌ | 成书年份（约数可不填） |
| `historicalNote` | string | ❌ | 历史背景补充，与时代事件的关联说明 |
| `quote` | string | ❌ | 中文名言（无则留空字符串） |
| `quoteEn` | string | ❌ | 英文名言（无则留空字符串） |

### 示例

```json
[
  {
    "id": "plato",
    "name": "柏拉图",
    "nameEn": "Plato",
    "born": -427,
    "died": -347,
    "bornApprox": false,
    "diedApprox": false,
    "nationality": "古希腊",
    "type": "philosopher",
    "school": ["greek-classical"],
    "era": "ancient",

    "portrait": {
      "url": "https://upload.wikimedia.org/wikipedia/commons/8/88/Plato_Silanion_Musei_Capitolini_MC1377.jpg",
      "source": "Wikipedia / Wikimedia Commons",
      "license": "Public Domain"
    },

    "summary": "唯心主义创始人，苏格拉底学生，亚里士多德老师，建立柏拉图学园。",

    "coreIdeas": [
      "理念论（Theory of Forms）：真实存在的是永恒不变的「理念」，感官世界只是其不完美的影子",
      "洞穴比喻：囚徒只能看到真实世界的影子，哲学引导人走出洞穴、认识真实",
      "灵魂不朽：灵魂先于肉体存在，死后继续存在，知识是灵魂对理念世界的回忆",
      "理想国：哲学家王治国，国家结构对应灵魂的三个部分（理性/激情/欲望）"
    ],

    "majorWorks": [
      { "title": "理想国", "titleEn": "The Republic", "year": -380 },
      { "title": "会饮篇", "titleEn": "Symposium", "year": -385 },
      { "title": "斐多篇", "titleEn": "Phaedo", "year": -385 },
      { "title": "美诺篇", "titleEn": "Meno", "year": -385 },
      { "title": "蒂迈欧篇", "titleEn": "Timaeus", "year": -360 }
    ],

    "historicalNote": "柏拉图学园（约前385~529年）是西方最早的高等学府，门楣刻「不习几何者不得入内」，529年被罗马皇帝下令关闭。",

    "quote": "无人能两次踏入同一条河流。",
    "quoteEn": "No man ever steps in the same river twice."
  }
]
```

> 注：`quote` 字段无名言时填 `""`，不要省略字段。

---

## 4. events.json — 历史背景事件

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 唯一标识（`.md` 中可用 `- id：` 显式指定，否则按名称生成） |
| `year` | number | ✅ | 事件年份 / 朝代起始年（负数为公元前） |
| `endYear` | number\|null | ❌ | 朝代等时间跨度型事件的结束年；点事件为 `null` |
| `yearApprox` | boolean | ✅ | 年份是否为近似值 |
| `name` | string | ✅ | 中文事件名 |
| `nameEn` | string | ❌ | 英文事件名 |
| `type` | string | ✅ | 事件类型：`political` / `scientific` / `religious` / `cultural` / `military`；东方另用中文 `朝代` / `思想` / `文化` |
| `description` | string | ❌ | 简短说明（中文，≤60字） |
| `region` | string | ❌ | 地理地区（如 `Europe` / `Global` / `中国`） |

> 东方中国朝代作为「时间跨度型事件」存于 `events-east.md`（`type: 朝代`，含 `year`+`endYear`），可在时间轴上渲染为朝代色块。

### 示例

```json
[
  {
    "id": "roman-empire",
    "year": -27,
    "yearApprox": false,
    "name": "罗马帝国建立",
    "nameEn": "Roman Empire Founded",
    "type": "political",
    "description": "元老院授予屋大维「奥古斯都」称号，古罗马由共和国进入帝国时代",
    "region": "Europe"
  },
  {
    "id": "einstein-miracle-year",
    "year": 1905,
    "yearApprox": false,
    "name": "爱因斯坦奇迹年",
    "nameEn": "Einstein's Annus Mirabilis",
    "type": "scientific",
    "description": "提出光量子假说、布朗运动理论、狭义相对论，改变物理学基础",
    "region": "Global"
  }
]
```

---

## 5. relations.json — 影响关系（P2 阶段）

> 此文件在 P2「关系图谱」功能开发时启用，数据整理阶段可先录入。

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | ✅ | 唯一标识 |
| `source` | string | ✅ | 影响来源的哲学家 id |
| `target` | string | ✅ | 受影响的哲学家 id |
| `type` | string | ✅ | 关系类型：`teacher-student` / `influenced` / `opposed` |
| `description` | string | ❌ | 关系说明（如「阿那克西曼德的弟子」） |
| `confidence` | string | ❌ | 可信度：`certain` / `probable` / `speculative` |

### 示例

```json
[
  {
    "id": "rel-socrates-plato",
    "source": "socrates",
    "target": "plato",
    "type": "teacher-student",
    "description": "柏拉图是苏格拉底最重要的学生，其对话录大多以苏格拉底为主角",
    "confidence": "certain"
  },
  {
    "id": "rel-plato-aristotle",
    "source": "plato",
    "target": "aristotle",
    "type": "teacher-student",
    "description": "亚里士多德在柏拉图学园学习约20年，后创立自己的逍遥学派",
    "confidence": "certain"
  }
]
```

---

## 约定

- **年份**：负数表示公元前（BCE），正数表示公元后（CE）
- **近似年份**：`bornApprox: true` 时，UI 展示时在年份前加「约」字
- **空字段**：可选字段无内容时填 `""` 或 `[]`，不要省略字段名（保证结构一致）
- **id 命名**：全英文小写，空格用连字符（`-`），如 `thomas-aquinas`
- **新增内容**：直接在对应 JSON 数组中追加对象，无需修改代码
