import erasJson from './data/eras.json'
import schoolsJson from './data/schools.json'
import philosophersJson from './data/philosophers.json'
import eventsJson from './data/events.json'
import type { Era, School, Philosopher, EventItem } from './types'

export const eras = erasJson as Era[]
export const schools = schoolsJson as School[]
export const philosophers = philosophersJson as Philosopher[]
export const events = eventsJson as EventItem[]

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
