import type { Philosopher } from '../types'
import { schoolById } from '../data'
import { lifeLabel } from '../lib/timeline'

interface Props {
  phil: Philosopher | null
  onClose: () => void
}

export function PhilosopherModal({ phil, onClose }: Props) {
  if (!phil) return null
  const schoolNames = phil.school
    .map((id) => schoolById.get(id)?.name)
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="关闭">
          ×
        </button>
        <div className="modal-head">
          <div className="avatar-lg" style={{ borderColor: schoolById.get(phil.school[0])?.color }}>
            {phil.portrait.url ? <img src={phil.portrait.url} alt={phil.name} /> : phil.name.slice(0, 1)}
          </div>
          <div>
            <h2>{phil.name}</h2>
            <div className="sub">
              {phil.nameEn} · {phil.nationality}
            </div>
            <div className="meta">
              {lifeLabel(phil)}　|　{phil.type}　|　{schoolNames}
            </div>
          </div>
        </div>

        {phil.summary && <p className="summary">{phil.summary}</p>}

        {phil.coreIdeas.length > 0 && (
          <section>
            <h3>核心思想</h3>
            <ul className="ideas">
              {phil.coreIdeas.map((idea, i) => (
                <li key={i}>{idea}</li>
              ))}
            </ul>
          </section>
        )}

        {phil.majorWorks.length > 0 && (
          <section>
            <h3>代表作</h3>
            <ul className="works">
              {phil.majorWorks.map((w, i) => (
                <li key={i}>
                  《{w.title}》{w.titleEn && <span className="en"> {w.titleEn}</span>}
                  {w.year != null && <span className="yr"> · {w.year < 0 ? `前${-w.year}` : w.year}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {phil.quote && <blockquote>「{phil.quote}」</blockquote>}
      </div>
    </div>
  )
}
