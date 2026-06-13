// 人生母题追问 —— 数据接口层
// 阶段1：本地 mock，先把交互形态跑通；
// 阶段2：将 askPhilosophers() 内部替换为「fetch Cloudflare Worker → 硅基流动」，
//        返回结构 (Answer[]) 保持不变，前端无需改动。

import { philosopherById } from '../data'

/** 单位哲学家对某个问题的回应 */
export interface Answer {
  philosopherId: string // 必须是 philosophers.json 中真实存在的 id（用于左侧节点联动高亮）
  view: string // 该哲学家对此问题的观点（以其口吻）
  citation?: string // 出处 / 著作，不确定则留空
}

/** 预置母题题库：空态轮播展示，点击直接提问（id 仅用于 React key） */
export const PRESET_MOTIFS = [
  { id: 'meaning', q: '人为什么活着？' },
  { id: 'happiness', q: '什么是幸福？' },
  { id: 'death', q: '该如何面对死亡？' },
  { id: 'freedom', q: '自由意味着什么？' },
  { id: 'effort', q: '努力一定有意义吗？' },
  { id: 'loneliness', q: '该如何面对孤独？' },
  { id: 'good-life', q: '什么才是好的生活？' },
  { id: 'justice', q: '何为正义？' },
  { id: 'suffering', q: '痛苦有意义吗？' },
  { id: 'know', q: '我们能真正认识世界吗？' },
  { id: 'others', q: '该如何对待他人？' },
  { id: 'time', q: '时间究竟是什么？' },
]

// ── 阶段1 mock 数据 ─────────────────────────────────────────
// 按预置母题手工编写若干高质量回应；自由输入走通用兜底。
// 所有 philosopherId 均取自 philosophers.json 真实 id。

const MOCK: Record<string, Answer[]> = {
  meaning: [
    {
      philosopherId: 'camus',
      view: '生命本身并无先天意义，世界对人的追问保持沉默——这就是「荒诞」。但我们不必因此自杀或寄望来世，而应清醒地反抗它：意义不是被给予的，而是在反抗中由你亲手创造。要想象西西弗斯是幸福的。',
      citation: '《西西弗神话》',
    },
    {
      philosopherId: 'zhuangzi',
      view: '何必苦苦追问「为什么」？方生方死，方死方生，是非彼此本无定准。顺其自然，与天地精神往来，逍遥于无何有之乡，活着这件事自会安顿，不待外求。',
      citation: '《庄子·齐物论》',
    },
    {
      philosopherId: 'sartre',
      view: '人是被「抛入」世界的，先存在，后才由自己的选择定义自己——存在先于本质。没有谁替你规定活着的理由，你的每一个选择都在为「人应当如何」立法。自由即重担。',
      citation: '《存在与虚无》',
    },
    {
      philosopherId: 'schopenhauer',
      view: '生命的内核是盲目的「意志」，欲望永不满足，得到即厌倦，得不到即痛苦，人生如钟摆在两者间往复。看清这一点，转向艺术的静观与同情，方能暂离意志的奴役。',
      citation: '《作为意志和表象的世界》',
    },
  ],
  happiness: [
    {
      philosopherId: 'aristotle',
      view: '幸福（eudaimonia）不是一时的快感，而是「合乎德性的灵魂的实现活动」——是一生持续地把人之为人的理性能力发挥到卓越。幸福是终极目的，我们做一切事都为了它，而它本身不为别的。',
      citation: '《尼各马可伦理学》',
    },
    {
      philosopherId: 'epicurus',
      view: '幸福是身体无痛苦、灵魂无纷扰的「宁静」（ataraxia）。它不靠纵欲，恰靠节制：辨明哪些欲望自然且必要，去除对死亡和神明的恐惧，与三两知己过简朴生活，足矣。',
      citation: '《致美诺寇的信》',
    },
    {
      philosopherId: 'confucius',
      view: '饭疏食饮水，曲肱而枕之，乐亦在其中矣。幸福不在富贵，而在心安理得、好学行仁。知之者不如好之者，好之者不如乐之者——把当为之事做成所乐之事，便是真乐。',
      citation: '《论语·述而》',
    },
    {
      philosopherId: 'zhuangzi',
      view: '濠梁之上，鱼之乐即我之乐。幸福不假外物，不系于得失成败，而在与万物相忘、随化而游的那份自在。鼓盆而歌，正因看透生死本是一气流转。',
      citation: '《庄子·秋水》',
    },
  ],
  death: [
    {
      philosopherId: 'socrates',
      view: '死亡无非两种：或如无梦的安眠，或是灵魂迁往另一世界与先贤对话——两者皆无可惧。真正的哲学，本就是练习死亡。一个正直的人，无论生死都不会遭逢真正的恶。',
      citation: '柏拉图《申辩篇》',
    },
    {
      philosopherId: 'epicurus',
      view: '死亡与我们无关：我们在时死亡不在，死亡在时我们已不在。对死的恐惧源于幻觉。看清这点，有限的生命反而因此变得可贵而从容。',
      citation: '《致美诺寇的信》',
    },
    {
      philosopherId: 'zhuangzi',
      view: '妻死，庄子鼓盆而歌。生之来不能却，其去不能止——生死如四时运行。把死看作大归，安时而处顺，哀乐便不能入。',
      citation: '《庄子·至乐》',
    },
    {
      philosopherId: 'marcus-aurelius',
      view: '不要轻蔑死亡，要欣然迎接它，因它也是自然所愿的一桩事。万物速朽，转瞬即被遗忘。既然如此，就在每个当下尽责而活，把死亡当作随时可能交还的礼物。',
      citation: '《沉思录》',
    },
  ],
}

// 自由输入兜底：选几位回应面最广的哲学家，套用其核心思想生成提示性回应。
function fallbackAnswers(question: string): Answer[] {
  const picks = ['socrates', 'zhuangzi', 'nietzsche', 'confucius']
  return picks
    .map((id) => philosopherById.get(id))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .map((p) => ({
      philosopherId: p.id,
      view: `（示例回应）面对「${question}」，${p.name}或会从其核心主张出发回应：${p.coreIdeas?.[0] ?? p.summary}`,
      citation: p.majorWorks?.[0]?.title,
    }))
}

function detectMotif(question: string): string | null {
  const q = question.trim()
  if (/活着|意义|为什么活|人生的意义/.test(q)) return 'meaning'
  if (/幸福|快乐|幸不幸福|怎样才幸福/.test(q)) return 'happiness'
  if (/死亡|死亡|怎么面对死|向死|死了/.test(q)) return 'death'
  return null
}

// Cloudflare Worker 地址。配置在 03-src/.env.local 的 VITE_ASK_API。
// 未配置时自动回退到本地 mock，方便没有后端的本地开发。
const API = import.meta.env.VITE_ASK_API as string | undefined

/** 提问入口：有 VITE_ASK_API 走真实 Worker（硅基流动），否则走本地 mock */
export async function askPhilosophers(question: string): Promise<Answer[]> {
  if (API) {
    const r = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    })
    if (!r.ok) throw new Error(`ask api ${r.status}`)
    const data = await r.json()
    const answers: Answer[] = Array.isArray(data?.answers) ? data.answers : []
    // 兜底过滤：只保留真实存在的 id，保证左侧联动不指向空节点
    return answers.filter((a) => a && philosopherById.has(a.philosopherId))
  }

  // —— 无后端：本地 mock 兜底 ——
  await new Promise((r) => setTimeout(r, 650)) // 模拟思考延迟，便于看 loading 态
  const motif = detectMotif(question)
  const answers = motif ? MOCK[motif] : fallbackAnswers(question)
  return answers.filter((a) => philosopherById.has(a.philosopherId))
}
