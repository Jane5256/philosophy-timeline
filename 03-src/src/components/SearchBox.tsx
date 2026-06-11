import { useMemo, useState } from 'react'
import type { Philosopher, School } from '../types'
import { philosophers, schools } from '../data'
import { lifeLabel } from '../lib/timeline'

export type PickItem = { kind: 'phil'; item: Philosopher } | { kind: 'school'; item: School }

export function SearchBox({ onPick }: { onPick: (p: PickItem) => void }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)

  const results = useMemo<PickItem[]>(() => {
    const k = q.trim().toLowerCase()
    if (!k) return []
    const ps: PickItem[] = philosophers
      .filter(
        (p) =>
          p.name.toLowerCase().includes(k) ||
          p.nameEn.toLowerCase().includes(k) ||
          p.majorWorks.some((w) => w.title.toLowerCase().includes(k)),
      )
      .slice(0, 6)
      .map((item) => ({ kind: 'phil', item }))
    const ss: PickItem[] = schools
      .filter((s) => s.name.toLowerCase().includes(k) || s.nameEn.toLowerCase().includes(k))
      .slice(0, 4)
      .map((item) => ({ kind: 'school', item }))
    return [...ps, ...ss]
  }, [q])

  return (
    <div className="search">
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setQ('')
            setOpen(false)
          }
        }}
        placeholder="搜索人物 / 思想流派 / 著作…"
      />
      {q && (
        <button
          className="search-clear"
          aria-label="清除"
          onMouseDown={(e) => {
            e.preventDefault()
            setQ('')
            setOpen(false)
          }}
        >
          ×
        </button>
      )}
      {open && results.length > 0 && (
        <ul className="search-results">
          {results.map((r) => (
            <li key={r.kind + r.item.id}>
              <button
                onMouseDown={(e) => {
                  e.preventDefault()
                  onPick(r)
                  setOpen(false)
                }}
              >
                <span className="sr-name">{r.item.name}</span>
                <span className={`sr-tag ${r.kind}`}>{r.kind === 'phil' ? '人物' : '流派'}</span>
                <span className="sr-sub">
                  {r.kind === 'phil' ? lifeLabel(r.item) : r.item.nameEn}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
