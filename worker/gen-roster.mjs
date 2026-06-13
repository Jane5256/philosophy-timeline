// 从前端实际使用的 philosophers.json 生成 Worker 用的「哲学家名单」。
// 名单作用：① 约束 LLM 只能从中选人（philosopherId 与前端 id 完全一致 → 左侧联动不落空）
//           ② 提供姓名/生卒/流派/简介作底料，降低编造。
// 用法：node gen-roster.mjs（部署 Worker 前若数据有更新就重跑一次）

import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const dataDir = resolve(here, '../app/src/data')

const phils = JSON.parse(readFileSync(resolve(dataDir, 'philosophers.json'), 'utf8'))
const schools = JSON.parse(readFileSync(resolve(dataDir, 'schools.json'), 'utf8'))
const schoolName = new Map(schools.map((s) => [s.id, s.name]))

const roster = phils.map((p) => ({
  id: p.id,
  name: p.name,
  nameEn: p.nameEn,
  born: p.born,
  died: p.died,
  region: p.region,
  nationality: p.nationality,
  schools: (p.school || []).map((id) => schoolName.get(id) || id),
  summary: p.summary,
}))

writeFileSync(resolve(here, 'roster.json'), JSON.stringify(roster))
console.log(`✓ roster.json 生成完成：${roster.length} 位哲学家`)
