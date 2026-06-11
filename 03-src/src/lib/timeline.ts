import type { Philosopher, School } from '../types'
import { schools, philosophers, schoolById } from '../data'

// ── 时间尺度（越上越晚 / 越下越早，底部为起源）──
// 数据现有范围约 公元前624(泰勒斯) → 1990，底部收到 -660、顶部到 2000，多余远古空白裁掉
export const YEAR_MIN = -660
export const YEAR_MAX = 2000
export const PX_PER_YEAR = 1.35
export const HEAD_PAD = 96 // 顶部（现代之后）留白 + 哲理文案区
export const FOOT_PAD = 96 // 底部（远古之前）留白 + 哲理文案区

// ── 横向尺寸 ──
export const LANE_W = 78 // 一条流派泳道宽
export const NODE = 46 // 头像直径
export const AXIS_W = 104 // 中央年代尺宽
export const RAIL_W = 34 // 朝代/政权轨单泳道宽

export const lifeLo = (p: Philosopher) => Math.min(p.born, p.died)
export const lifeHi = (p: Philosopher) => Math.max(p.born, p.died)

export const yOf = (year: number) => HEAD_PAD + (YEAR_MAX - year) * PX_PER_YEAR
export const yearAt = (y: number) => YEAR_MAX - (y - HEAD_PAD) / PX_PER_YEAR
export const TOTAL_H = HEAD_PAD + (YEAR_MAX - YEAR_MIN) * PX_PER_YEAR + FOOT_PAD

// ── 区间泳道分配（时间重叠的项分到不同泳道，避免交叠）──
function partition<T>(items: T[], gid: (t: T) => string, gs: (t: T) => number, ge: (t: T) => number) {
  const sorted = [...items].sort((a, b) => gs(a) - gs(b))
  const laneEnd: number[] = []
  const map = new Map<string, number>()
  for (const it of sorted) {
    let lane = laneEnd.findIndex((e) => e <= gs(it))
    if (lane === -1) {
      lane = laneEnd.length
      laneEnd.push(ge(it))
    } else {
      laneEnd[lane] = ge(it)
    }
    map.set(gid(it), lane)
  }
  return map
}
const lanesIn = (m: Map<string, number>) => Math.max(0, ...m.values()) + 1

const westSchools = schools.filter((s) => s.region === 'west')
const eastSchools = schools.filter((s) => s.region === 'east')
const westSchoolLanes = partition(westSchools, (s) => s.id, (s) => s.start, (s) => s.end)
const eastSchoolLanes = partition(eastSchools, (s) => s.id, (s) => s.start, (s) => s.end)

const nWestSchool = lanesIn(westSchoolLanes)
const nEastSchool = lanesIn(eastSchoolLanes)

// ── 横向布局：[东流派][东朝代轨·单列][中轴][西政权轨·单列][西流派] ──
const LEFT_MARGIN = 28
export const axisLeft = LEFT_MARGIN + nEastSchool * LANE_W + RAIL_W
export const axisRight = axisLeft + AXIS_W
export const centerX = axisLeft + AXIS_W / 2
export const eastRailX = axisLeft - RAIL_W // 东方朝代轨（单列）
export const westRailX = axisRight // 西方政权轨（单列）
export const canvasWidth = axisRight + RAIL_W + nWestSchool * LANE_W + 28

/** 流派泳道左边缘 x */
export function schoolLaneX(s: School): number {
  if (s.region === 'west') {
    const L = westSchoolLanes.get(s.id) ?? 0
    return axisRight + RAIL_W + L * LANE_W
  }
  const L = eastSchoolLanes.get(s.id) ?? 0
  return axisLeft - RAIL_W - (L + 1) * LANE_W
}

function primarySchool(p: Philosopher): School | undefined {
  for (const id of p.school) {
    const s = schoolById.get(id)
    if (s) return s
  }
  return undefined
}

export interface Placed {
  p: Philosopher
  x: number
  y: number
}

export const placedPhilosophers: Placed[] = philosophers.map((p) => {
  const s = primarySchool(p)
  const laneX = s ? schoolLaneX(s) : centerX - LANE_W / 2
  return { p, x: laneX + LANE_W / 2, y: yOf(p.born) }
})
export const placedById = new Map(placedPhilosophers.map((pl) => [pl.p.id, pl]))

/** 流派在画布上的定位点（用于搜索定位） */
export function schoolAnchor(s: School): { x: number; y: number } {
  return { x: schoolLaneX(s) + LANE_W / 2, y: yOf((s.start + s.end) / 2) }
}

export interface BandRect {
  s: School
  left: number
  top: number
  width: number
  height: number
}

const BAND_W = LANE_W - 12
export const bands: BandRect[] = schools.map((s) => ({
  s,
  left: schoolLaneX(s) + (LANE_W - BAND_W) / 2, // 在泳道内居中，与头像中心对齐
  top: yOf(s.end),
  width: BAND_W,
  height: (s.end - s.start) * PX_PER_YEAR,
}))

/** 给定年份，返回东西方同期在世的思想家 */
export function contemporaries(year: number): { west: Philosopher[]; east: Philosopher[] } {
  const west: Philosopher[] = []
  const east: Philosopher[] = []
  for (const p of philosophers) {
    if (lifeLo(p) <= year && year <= lifeHi(p)) {
      ;(p.region === 'west' ? west : east).push(p)
    }
  }
  const byBorn = (a: Philosopher, b: Philosopher) => a.born - b.born
  return { west: west.sort(byBorn), east: east.sort(byBorn) }
}

export function formatYear(y: number): string {
  const v = Math.round(y)
  if (v < 0) return `公元前 ${-v}`
  if (v === 0) return '公元元年'
  return `公元 ${v}`
}

export function shortYear(y: number): string {
  const v = Math.round(y)
  return v < 0 ? `${-v}BC` : v === 0 ? '1' : `${v}`
}

export function lifeLabel(p: Philosopher): string {
  const f = (y: number, approx: boolean) => (approx ? '约' : '') + (y < 0 ? `前${-y}` : `${y}`)
  return `${f(p.born, p.bornApprox)} – ${f(p.died, p.diedApprox)}`
}
