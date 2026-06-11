export type Region = 'west' | 'east'

export interface Era {
  id: string
  name: string
  nameEn: string
  region: Region
  start: number
  end: number
  color: string
}

export interface School {
  id: string
  name: string
  nameEn: string
  alternateNames: string[]
  era: string
  region: Region
  start: number
  end: number
  color: string
  description: string
  coreThemes: string[]
  representativePhilosophers: string[]
}

export interface Work {
  title: string
  titleEn: string
  year: number | null
}

export interface Philosopher {
  id: string
  name: string
  nameEn: string
  born: number
  died: number
  bornApprox: boolean
  diedApprox: boolean
  nationality: string
  type: string
  school: string[]
  era: string
  region: Region
  portrait: { url: string; source: string; license: string; focus?: string }
  summary: string
  coreIdeas: string[]
  majorWorks: Work[]
  historicalNote: string
  quote: string
  quoteEn: string
}

export interface EventItem {
  id: string
  year: number
  endYear: number | null
  yearApprox: boolean
  name: string
  nameEn: string
  type: string
  description: string
  region: string
}
