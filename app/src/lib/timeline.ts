import type { Philosopher, School } from '../types'
import { schools, philosophers, schoolById } from '../data'

// ── 时间范围（越上越晚 / 越下越早，底部为起源）──
export const YEAR_MIN = -660
export const YEAR_MAX = 2000

// 垂直尺度（像素/年）现在是运行时可变的「缩放」量
export const BASE_PPY = 1.35 // 舒适细看默认缩放
export const PPY_MIN = 0.2 // 最小（全景概览）
export const PPY_MAX = 4 // 最大（深度细看）
export const clampPpy = (p: number) => Math.max(PPY_MIN, Math.min(PPY_MAX, p))

export const HEAD_PAD = 96 // 顶部留白 + 哲理文案区
export const FOOT_PAD = 96 // 底部留白 + 哲理文案区

// ── 横向尺寸（与缩放无关，固定）──
export const LANE_W = 78
export const NODE = 46
export const AXIS_W = 104
export const RAIL_W = 34

export const lifeLo = (p: Philosopher) => Math.min(p.born, p.died)
export const lifeHi = (p: Philosopher) => Math.max(p.born, p.died)

// y / year 互转（依赖当前缩放 ppy）
export const yOf = (year: number, ppy: number) => HEAD_PAD + (YEAR_MAX - year) * ppy
export const yearAt = (y: number, ppy: number) => YEAR_MAX - (y - HEAD_PAD) / ppy
export const totalH = (ppy: number) => HEAD_PAD + (YEAR_MAX - YEAR_MIN) * ppy + FOOT_PAD

/** 适配视口高度的「全景」缩放：让整段时间正好铺满一屏 */
export const fitPpy = (viewH: number) => clampPpy((viewH - HEAD_PAD - FOOT_PAD) / (YEAR_MAX - YEAR_MIN))
/** 让某时间区间铺满视口的缩放 */
export const rangePpy = (start: number, end: number, viewH: number) =>
  clampPpy((viewH - 80) / Math.max(1, Math.abs(end - start)))

// ── 流派泳道分配（区间划分，避免重叠）──
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

// ── 横向布局：[东流派][东朝代轨][中轴][西政权轨][西流派] ──
const LEFT_MARGIN = 28
export const axisLeft = LEFT_MARGIN + nEastSchool * LANE_W + RAIL_W
export const axisRight = axisLeft + AXIS_W
export const centerX = axisLeft + AXIS_W / 2
export const eastRailX = axisLeft - RAIL_W
export const westRailX = axisRight
export const canvasWidth = axisRight + RAIL_W + nWestSchool * LANE_W + 28

// 水平自适应：把整张画布（含列宽/轨道/中轴）按比例缩放，使东西方都在画面里。
// 缩到最小（HS_MIN）后仍不够则横向滚动。最小处单列 ≈ LANE_W*HS_MIN ≈ 26px，足够竖排流派名。
export const HS_MIN = 0.34
export const fitHs = (stageW: number) => Math.max(HS_MIN, Math.min(1, stageW / canvasWidth))

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

// 人物 x（固定）；y 在渲染时按 ppy 计算
export interface Placed {
  p: Philosopher
  x: number
}
export const placedPhilosophers: Placed[] = philosophers.map((p) => {
  const s = primarySchool(p)
  const laneX = s ? schoolLaneX(s) : centerX - LANE_W / 2
  return { p, x: laneX + LANE_W / 2 }
})
export const placedById = new Map(placedPhilosophers.map((pl) => [pl.p.id, pl]))

// 流派色带 x（固定）；top/height 按 ppy 计算
export const BAND_W = LANE_W - 12
export interface BandRect {
  s: School
  left: number
}
export const bands: BandRect[] = schools.map((s) => ({
  s,
  left: schoolLaneX(s) + (LANE_W - BAND_W) / 2,
}))

/** 流派定位锚点 x（搜索定位用）；年取起始年 */
export const schoolAnchorX = (s: School) => schoolLaneX(s) + LANE_W / 2

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
