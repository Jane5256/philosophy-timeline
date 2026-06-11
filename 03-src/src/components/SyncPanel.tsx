import type { Philosopher, Era, EventItem } from '../types'
import { formatYear, lifeLabel } from '../lib/timeline'

interface Periods {
  eastEra?: Era
  westEra?: Era
  dynasty?: EventItem
  state?: EventItem
}

interface Props {
  year: number
  west: Philosopher[]
  east: Philosopher[]
  periods: Periods
  open?: boolean
  onSelectPhil: (p: Philosopher) => void
}

function Side({
  title,
  side,
  era,
  polity,
  people,
  onSelectPhil,
}: {
  title: string
  side: 'west' | 'east'
  era?: Era
  polity?: string
  people: Philosopher[]
  onSelectPhil: (p: Philosopher) => void
}) {
  return (
    <div className={`sync-col ${side}`}>
      <div className="sync-col-title">{title}</div>
      <div className="period">
        <span className="period-polity">{polity ?? '—'}</span>
        <span className="period-era">{era ? era.name : '—'}</span>
      </div>
      <div className="people-h">
        在世思想家 <span className="cnt">{people.length}</span>
      </div>
      {people.length === 0 ? (
        <div className="sync-empty">此刻思想沉潜</div>
      ) : (
        people.map((p) => (
          <button className="sync-item" key={p.id} onClick={() => onSelectPhil(p)}>
            <span className="si-name">{p.name}</span>
            <span className="si-life">{lifeLabel(p)}</span>
            <span className="si-sum">{p.summary}</span>
          </button>
        ))
      )}
    </div>
  )
}

export function SyncPanel({ year, west, east, periods, open, onSelectPhil }: Props) {
  return (
    <div className={`sync-panel ${open ? 'open' : ''}`}>
      <div className="sync-head">
        <div className="sync-year">{formatYear(year)}</div>
        <div className="sync-hint">拖动时间轴游标查看同期</div>
      </div>
      <div className="sync-cols">
        <Side
          title="东方"
          side="east"
          era={periods.eastEra}
          polity={periods.dynasty?.name}
          people={east}
          onSelectPhil={onSelectPhil}
        />
        <Side
          title="西方"
          side="west"
          era={periods.westEra}
          polity={periods.state?.name}
          people={west}
          onSelectPhil={onSelectPhil}
        />
      </div>
    </div>
  )
}
