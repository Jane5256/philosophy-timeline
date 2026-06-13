import erasJson from './data/eras.json'
import schoolsJson from './data/schools.json'
import philosophersJson from './data/philosophers.json'
import eventsJson from './data/events.json'
import synchroniesJson from './data/synchronies.json'
import type { Era, School, Philosopher, EventItem, Synchrony } from './types'

export const eras = erasJson as Era[]
export const schools = schoolsJson as School[]
export const philosophers = philosophersJson as Philosopher[]
export const events = eventsJson as EventItem[]
export const synchronies = synchroniesJson as Synchrony[]

export const schoolById = new Map(schools.map((s) => [s.id, s]))
export const philosopherById = new Map(philosophers.map((p) => [p.id, p]))

export const dynasties = events.filter((e) => e.type === '朝代' && e.endYear != null)

// 西方政权轨：单列展示，只保留主要国家，避免交叠过多
const MAIN_WEST_STATES = new Set([
  'state-greek-poleis',
  'state-roman-republic',
  'state-roman-empire',
  'state-byzantine',
  'state-holy-roman-empire',
  'state-france',
  'state-britain',
  'state-usa',
  'state-germany',
])
export const westStates = events.filter(
  (e) => e.type === '政权' && e.endYear != null && MAIN_WEST_STATES.has(e.id),
)

/** 某年份所属的（第一个）时间跨度项 */
const spanAt = (list: EventItem[], year: number) =>
  list.find((e) => e.year <= year && year <= (e.endYear as number))
export const dynastyAt = (year: number) => spanAt(dynasties, year)
export const westStateAt = (year: number) => spanAt(westStates, year)
export const eraAt = (year: number, region: 'west' | 'east') =>
  eras.find((e) => e.region === region && e.start <= year && year <= e.end)

/** 某年份命中的同期金句：取覆盖该年、区间最窄（最精确）的一条 */
export const synchronyAt = (year: number): Synchrony | undefined =>
  synchronies
    .filter((s) => s.start <= year && year <= s.end)
    .sort((a, b) => a.end - a.start - (b.end - b.start))[0]
