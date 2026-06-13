// 人生母题追问 —— Cloudflare Worker（密钥代理 + 提示词编排）
// 前端 → 本 Worker（藏 SILICONFLOW_API_KEY）→ 硅基流动 OpenAI 兼容接口 → 返回结构化 JSON
//
// 部署见同目录 README.md。需要：
//   secret  SILICONFLOW_API_KEY  （npx wrangler secret put SILICONFLOW_API_KEY）
//   var     MODEL                （wrangler.toml，可换模型）

import roster from './roster.json'

const SILICONFLOW_URL = 'https://api.siliconflow.cn/v1/chat/completions'
const DEFAULT_MODEL = 'deepseek-ai/DeepSeek-V3'

// 允许跨域来源：线上站点 + 本地开发
const ALLOWED_ORIGINS = new Set([
  'https://jane5256.github.io',
  'http://localhost:5173',
  'http://localhost:4173',
])

const ROSTER_IDS = new Set(roster.map((p) => p.id))

function fmtYear(y) {
  if (y == null) return '?'
  return y < 0 ? `前${-y}` : `${y}`
}

// 名单文本（注入系统提示）：id | 姓名(英文) | 生卒 | 地域·国别 | 流派 | 简介
const ROSTER_LINES = roster
  .map(
    (p) =>
      `${p.id} | ${p.name}${p.nameEn ? `（${p.nameEn}）` : ''} | ${fmtYear(p.born)}~${fmtYear(p.died)} | ${
        p.region === 'east' ? '东方' : '西方'
      }·${p.nationality || ''} | ${(p.schools || []).join('、')} | ${p.summary || ''}`,
  )
  .join('\n')

function systemPrompt() {
  return `你是一位贯通东西方哲学史的引导者。用户会说出一个困扰他的人生母题，你要从下面这份「哲学家名单」里挑选 3 到 5 位最能回应该问题的哲学家，分别用他们各自的思想与口吻作答。

【哲学家名单】（格式：id | 姓名 | 生卒 | 地域·国别 | 流派 | 简介）
${ROSTER_LINES}

【严格要求】
1. 只能从上面名单里选人；philosopherId 必须与名单中的 id 完全一致，绝不编造或臆造 id。
2. 尽量东西方、不同流派兼顾，挑选视角最有差异、最契合该问题的人。
3. view：80~160 字，用该哲学家的核心思想与口吻回应这个「具体问题」，言之有物、扣题，不要空泛套话。
4. citation：只填确有其事的代表著作名（如《论语》《理想国》）；若不确定出处就留空字符串 ""，绝不编造书名。
5. 仅输出 JSON，不要任何解释、前后缀或 markdown 代码块，结构严格为：
{"answers":[{"philosopherId":"","view":"","citation":""}]}`
}

function jsonResponse(obj, status, origin) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  })
}

function corsHeaders(origin) {
  const allow = ALLOWED_ORIGINS.has(origin) ? origin : 'https://jane5256.github.io'
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

// 从模型回复里稳健地抽出 JSON（容忍多余文字 / ```json 包裹）
export function extractAnswers(content) {
  if (!content) return []
  let text = content.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    const m = text.match(/\{[\s\S]*\}/)
    if (!m) return []
    try {
      data = JSON.parse(m[0])
    } catch {
      return []
    }
  }
  const answers = Array.isArray(data?.answers) ? data.answers : []
  return answers
    .filter((a) => a && typeof a.philosopherId === 'string' && ROSTER_IDS.has(a.philosopherId) && a.view)
    .map((a) => ({
      philosopherId: a.philosopherId,
      view: String(a.view).trim(),
      citation: a.citation ? String(a.citation).trim() : '',
    }))
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || ''

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) })
    }
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'method not allowed' }, 405, origin)
    }

    let question = ''
    try {
      const body = await request.json()
      question = (body?.question || '').toString().trim()
    } catch {
      return jsonResponse({ error: 'invalid json body' }, 400, origin)
    }
    if (!question) return jsonResponse({ error: 'empty question' }, 400, origin)
    if (question.length > 200) question = question.slice(0, 200)

    if (!env.SILICONFLOW_API_KEY) {
      return jsonResponse({ error: 'server not configured: missing SILICONFLOW_API_KEY' }, 500, origin)
    }

    let upstream
    try {
      upstream = await fetch(SILICONFLOW_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.SILICONFLOW_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: env.MODEL || DEFAULT_MODEL,
          messages: [
            { role: 'system', content: systemPrompt() },
            { role: 'user', content: question },
          ],
          temperature: 0.7,
          max_tokens: 1600,
          response_format: { type: 'json_object' }, // 强制合法 JSON（DeepSeek/Qwen 等支持）
        }),
      })
    } catch {
      return jsonResponse({ error: 'upstream fetch failed' }, 502, origin)
    }

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => '')
      return jsonResponse({ error: `upstream ${upstream.status}`, detail: detail.slice(0, 300) }, 502, origin)
    }

    const data = await upstream.json().catch(() => null)
    const content = data?.choices?.[0]?.message?.content || ''
    const answers = extractAnswers(content)

    return jsonResponse({ answers }, 200, origin)
  },
}
