# AGENTS.md

本文件面向所有参与本仓库工作的编程代理与语言模型。无论使用何种模型、IDE 或代理框架，都应遵守以下约定。

## 1. 项目定位

Philosophy Timeline 是一个中文优先的东西方思想史交互可视化项目。

核心目标：

- 将东方与西方思想史并排放在同一条时间轴上；
- 通过流派、人物、时代和历史事件形成可浏览的思想史结构；
- 支持同期思想家对照；
- 支持用户围绕人生问题向哲学家“追问”，由后端模型返回带人物、观点和出处的结构化回答；
- 优先保证内容可信、数据可维护、交互清晰，而不是追求无依据的内容规模。

当前技术结构：

- 前端：React 19 + Vite + TypeScript；
- 内容数据：Markdown 源文件 + Python 转换脚本；
- AI 后端：Cloudflare Worker，代理硅基流动的 OpenAI 兼容接口；
- 部署：GitHub Pages，推送 `main` 后由 GitHub Actions 自动构建和部署。

线上地址：

- https://jane5256.github.io/philosophy-timeline/

## 2. 目录结构

```text
Philosophy Timeline/
├── app/                         # React + Vite + TypeScript 前端
│   ├── src/
│   │   ├── components/          # 时间轴、搜索、人物详情、流派抽屉等组件
│   │   ├── lib/
│   │   │   ├── timeline.ts      # 年代坐标、泳道、同期计算
│   │   │   └── ask.ts           # 人生问题 Worker 调用与本地 mock
│   │   ├── data.ts              # 加载 JSON 并建立索引
│   │   ├── types.ts             # 数据类型
│   │   └── data/                # 自动同步生成，已忽略，禁止手工维护
│   ├── scripts/
│   │   └── sync-data.mjs        # data/structured/*.json → app/src/data/
│   └── public/                  # Logo、图标、人物画像等静态资源
├── data/
│   ├── structured/              # 内容源文件与生成后的站点 JSON
│   └── convert.py               # Markdown → JSON 转换脚本
├── worker/                      # 人生母题追问的 Cloudflare Worker
│   ├── worker.js
│   ├── gen-roster.mjs           # 从哲学家数据生成 Worker 名单
│   ├── roster.json              # Worker 使用的人物名单
│   └── wrangler.toml
├── docs/
│   ├── data-schema.md           # 数据字段规范
│   └── interaction-design-principles.md
├── .github/workflows/deploy.yml # GitHub Pages 自动部署
└── README.md
```

修改代码前，先阅读与任务直接相关的文件。不要仅凭文件名猜测数据结构、组件职责或脚本行为。

## 3. 数据源与数据管线

### 3.1 单一事实来源

内容维护遵循：

```text
Markdown 源
    ↓ python3 data/convert.py
data/structured/*.json
    ↓ app/scripts/sync-data.mjs
app/src/data/
    ↓ Vite / TypeScript build
app/dist/
```

原则：

1. 哲学家、流派、事件和同期文案应优先编辑对应的 Markdown 源文件；
2. 不要只修改生成后的 JSON；
3. 不要手工修改 `app/src/data/`；
4. `app/src/data/` 和 `app/dist/` 都是自动生成且被 Git 忽略的目录；
5. 数据字段和引用规则以 `docs/data-schema.md` 为准。

### 3.2 Markdown 与 JSON 的对应关系

```text
philosophers.json
  ← philosophers.md
  + philosophers-east.md

schools.json
  ← schools.md
  + schools-east.md

events.json
  ← events.md
  + events-east.md

synchronies.json
  ← synchronies.md
```

以下文件不由 `convert.py` 生成，需单独维护：

- `eras.json`：东西方时代区间；
- `portraits.json`：人物画像地址；
- `portrait-focus.json`：画像聚焦位置；
- `portraits-remote.json`：远程画像候选或记录。

`convert.py` 会在生成 `philosophers.json` 时，从画像配置中注入画像 URL 和焦点信息。

### 3.3 数据引用规则

修改内容时应检查：

- `philosophers[].school[]` 必须引用 `schools.json` 中存在的 id；
- `philosophers[].era` 和 `schools[].era` 必须引用 `eras.json` 中存在的 id；
- 流派的 `representativePhilosophers[]` 应使用哲学家 id；
- id 使用英文小写和连字符，生成后必须保持稳定；
- 公元前年份使用负数；
- 近似年份应保留“约”的语义；
- 不确定或有争议的历史信息，不应伪装成精确事实；
- 新人物如需稳定的英文 id，应同步维护 `data/convert.py` 中的映射；
- 新流派如需稳定 id，应同步维护 `SCHOOL_ID_MAP`。

### 3.4 Worker 名单管线

Worker 使用 `worker/roster.json` 约束模型可选择的人物。

哲学家数据发生变化后，应运行：

```bash
npm run roster --prefix worker
```

这只更新本地名单，不会部署 Worker。

只有用户明确要求部署时，才可以运行：

```bash
npm run deploy --prefix worker
```

不要把部署命令当作普通验证命令。

## 4. 修改原则

### 4.1 小范围修改

- 只修改当前任务要求的文件；
- 不做无关重构、批量格式化或目录迁移；
- 不覆盖用户尚未提交的改动；
- 修改前先检查 `git status` 和相关文件的 diff；
- 发现文档与实现不一致时，以实际代码和数据管线为准，并指出差异。

### 4.2 数据内容质量

新增哲学家、流派和历史事件时：

- 区分史实、传统归属和现代学术推断；
- 对商周、先秦等年代不确定的人物，避免无依据地给出精确生卒年；
- 名言、著作和学派归属不得凭空补全；
- 没有可靠原文或出处时，宁可留空或标注不确定；
- AI 生成内容应诚实、可追溯，不应伪造引用；
- 中文表述应简洁、准确，避免营销化语言。

### 4.3 生成文件

完成数据源修改后，运行转换脚本并检查生成结果：

```bash
python3 data/convert.py
git diff -- data/structured/
```

重点确认：

- 没有意外删除既有记录；
- JSON 中没有重复 id；
- Markdown 源与 JSON 结果一致；
- 新记录的 school、era 和 representativePhilosophers 引用有效；
- 转换没有造成无关的大面积数据重排。

## 5. 验证命令

### 5.1 数据转换

从仓库根目录运行：

```bash
python3 data/convert.py
```

当前转换输出应覆盖：

- `philosophers.json`
- `schools.json`
- `events.json`
- `synchronies.json`

`eras.json` 不在转换范围内。

### 5.2 前端数据同步

```bash
npm run sync-data --prefix app
```

`npm run dev` 和 `npm run build` 会通过 `predev` / `prebuild` 自动执行同步，一般不需要重复手动运行。

### 5.3 前端构建

```bash
npm run build --prefix app
```

构建必须通过 TypeScript 检查和 Vite 打包。

### 5.4 前端静态检查

```bash
npm run lint --prefix app
```

如果 lint 失败：

- 先判断错误是否由本次修改引入；
- 不要为了通过 lint 顺手重构无关文件；
- 应在结果中明确区分“本次引入的问题”和“仓库已有问题”。

### 5.5 本地开发

```bash
npm run dev --prefix app
```

默认地址：

```text
http://localhost:5173/
```

数据或时间范围调整后，应人工检查：

- 时间轴能否完整覆盖新增年代；
- 人物节点是否位于正确的东西方区域；
- 流派色带是否覆盖正确年份；
- 朝代轨道是否与时间轴范围一致；
- 搜索、人物详情、流派抽屉和同期面板是否仍可使用；
- 缺少画像的人物是否有合理的降级展示。

### 5.6 Worker 检查

更新哲学家数据后：

```bash
npm run roster --prefix worker
```

如果修改了 Worker 代码，可在 `worker/` 中运行：

```bash
npm run dev
```

除非用户明确要求，不执行 Worker 部署，也不调用会产生费用的真实模型接口。

### 5.7 当前测试边界

仓库目前没有独立的自动化测试脚本。最低验证组合是：

```bash
python3 data/convert.py
npm run build --prefix app
npm run lint --prefix app
```

涉及交互或时间轴布局时，还需要浏览器人工检查。

## 6. 隐私与发布边界

### 6.1 禁止读取或提交的内容

除非用户明确授权，不读取、不展示、不修改、不提交：

- `.env.local`；
- 未被跟踪的 `.env*` 文件；
- API key、访问令牌、Cookie、账户信息；
- Cloudflare、硅基流动或其他平台的凭据；
- `_local/` 中的内部规划、设计过程、复盘和源料；
- `.claude/` 等本地代理配置；
- 用户电脑中仓库之外的私人资料。

如果终端输出意外包含密钥或令牌，不要在回答中复述。

### 6.2 前端环境变量

所有以 `VITE_` 开头的变量都会被内联到浏览器产物，因此：

- `VITE_` 变量只能保存公开配置，例如 Worker URL；
- API key、访问令牌和其他秘密绝不能放入 `VITE_` 变量；
- 硅基流动密钥只能由 Cloudflare Worker 的 secret 机制保存；
- 不要把真实密钥写入示例配置、源代码、文档或 Git 历史。

### 6.3 本地与公开内容

以下目录已被设计为本地或生成内容：

- `_local/`：内部资料，不对外；
- `.claude/`：本地代理配置；
- `app/src/data/`：自动同步数据；
- `app/dist/`：构建产物；
- `node_modules/`：依赖目录。

不要用强制添加等方式绕过 `.gitignore` 提交这些目录。

## 7. Git 安全规则

当前仓库可能存在用户尚未提交的修改。所有代理必须：

1. 开始工作前运行：

   ```bash
   git status --short --branch
   ```

2. 修改前检查目标文件已有 diff；
3. 保留与当前任务无关的用户改动；
4. 不使用可能覆盖工作的命令，例如：

   ```text
   git reset --hard
   git checkout -- <file>
   git restore <file>
   git clean -fd
   ```

   除非用户明确要求并确认范围；

5. 不擅自 stash、commit、amend、rebase、merge、push 或切换分支；
6. 不修改 Git 历史；
7. 不用 `git add .` 混入无关文件，应按文件精确暂存；
8. 不提交密钥、私有资料、生成目录或依赖目录；
9. 在声称完成前再次检查：

   ```bash
   git status --short
   git diff --check
   git diff --stat
   ```

10. `main` 分支的 push 会触发 GitHub Pages 自动部署，因此 push 等同于发布操作，必须取得用户明确授权。

## 8. 当前商周与先秦扩展进度

本节是工作区状态快照，不代表已经提交或发布。

### 已完成的数据和代码调整

- 时间轴下限由前 660 年扩展至前 1160 年；
- 东方 `pre-qin` 时代起点由前 770 年扩展至前 1160 年；
- 西方 `ancient` 时代起点由前 600 年扩展至前 820 年；
- 新增东方流派“上古经典”：
  - id：`ancient-classics`
  - 时间范围：前 1100—前 770 年
  - 代表人物：周文王
- 新增“纵横家”流派：
  - id：`school-of-diplomacy`
  - 代表人物：鬼谷子、苏秦、张仪
- 新增 12 位东方人物：
  - 周文王
  - 姜子牙
  - 曾子
  - 子思
  - 杨朱
  - 列子
  - 鬼谷子
  - 苏秦
  - 张仪
  - 李悝
  - 吴起
  - 孙膑
- `convert.py` 已加入上述人物和新流派的稳定 id 映射；
- 现有朝代事件数据已经包含夏、商、西周、春秋和战国；
- 当前生成数据规模：
  - 11 个时代；
  - 47 个流派；
  - 119 位人物；
  - 67 个事件；
  - 18 条同期文案。

### 已验证

- Markdown → JSON 转换结果与当前生成文件一致；
- 前端 TypeScript + Vite 生产构建通过；
- 新时间范围可以正常进入构建产物。

### 尚未完成或需要确认

- 新增人物中已有 10 位配置了经 Wikimedia Commons 核验为公有领域的本地画像：周文王、姜子牙、曾子、子思、列子、鬼谷子、苏秦、张仪、吴起、孙膑；
- 杨朱暂未找到身份明确、适合作为头像且许可清晰的图片；
- 李悝目前只找到采用署名类自由许可（CC BY 2.5 / GFDL，并兼容迁移至 CC BY-SA 3.0）的现代塑像照片，与现有数据统一标注为 Public Domain 的机制不兼容，因此暂未纳入；
- 本轮没有新增商周专题同期文案；
- 本轮没有修改夏、商、西周朝代事件内容；
- 商周扩展目前以周文王、姜子牙和“上古经典”为主，尚不是完整的商周思想人物谱系；
- 是否继续加入商周人物、经典、思想主题和同期对照，需要先确认内容边界与史料标准；
- 当前 lint 仍有 6 个已有错误，位于：
  - `app/src/App.tsx`：render 阶段写入 ref；
  - `app/src/components/PhilosopherModal.tsx`：不规则空白字符。
  这些文件不属于当前商周数据扩展改动，修复时应单独处理。

## 9. 完成任务时的报告格式

完成修改后，应简要说明：

1. 修改了哪些文件；
2. 数据源和生成文件是否同步；
3. 实际运行了哪些验证命令；
4. 哪些验证通过；
5. 是否存在仓库已有错误或未完成项；
6. 是否发生了部署、提交或推送。

不得把未运行的验证描述为“已通过”，也不得把未提交的内容描述为“已发布”。
