import type { School, Philosopher } from '../types'
import { philosopherById } from '../data'
import { lifeLabel } from '../lib/timeline'

interface Props {
  school: School | null
  onClose: () => void
  onSelectPhil: (p: Philosopher) => void
}

export function SchoolDrawer({ school, onClose, onSelectPhil }: Props) {
  if (!school) return null
  const reps = school.representativePhilosophers
    .map((id) => philosopherById.get(id))
    .filter((p): p is Philosopher => !!p)

  return (
    <aside className="drawer" style={{ borderTopColor: school.color }}>
      <button className="close" onClick={onClose} aria-label="关闭">
        ×
      </button>
      <div className="drawer-tag" style={{ background: school.color }}>
        {school.region === 'east' ? '东方' : '西方'} · {school.nameEn}
      </div>
      <h2>{school.name}</h2>
      {school.alternateNames.length > 0 && <div className="sub">别名：{school.alternateNames.join('、')}</div>}
      <p className="summary">{school.description}</p>

      {school.coreThemes.length > 0 && (
        <div className="chips">
          {school.coreThemes.map((t) => (
            <span className="chip" key={t} style={{ borderColor: school.color }}>
              {t}
            </span>
          ))}
        </div>
      )}

      <h3>代表人物</h3>
      <ul className="rep-list">
        {reps.map((p) => (
          <li key={p.id}>
            <button onClick={() => onSelectPhil(p)}>
              <span className="rep-name">{p.name}</span>
              <span className="rep-life">{lifeLabel(p)}</span>
            </button>
          </li>
        ))}
      </ul>
    </aside>
  )
}
