import { useEffect, useRef, useState } from 'react'
import type { Philosopher } from '../types'
import { philosopherById, schoolById } from '../data'
import { askPhilosophers, PRESET_MOTIFS, type Answer } from '../lib/ask'

interface Turn {
  question: string
  answers: Answer[]
}

interface Props {
  onSelectPhil: (p: Philosopher, focus?: boolean) => void
  onHighlight: (ids: Set<string>) => void
}

export function MotifPanel({ onSelectPhil, onHighlight }: Props) {
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const PAGE_SIZE = 3
  const pageCount = Math.ceil(PRESET_MOTIFS.length / PAGE_SIZE)
  const empty = turns.length === 0

  // 空态时每 10 秒轮播一批预置母题
  useEffect(() => {
    if (!empty) return
    const t = setTimeout(() => setPage((p) => (p + 1) % pageCount), 5000)
    return () => clearTimeout(t)
  }, [empty, pageCount, page])

  const visibleMotifs = PRESET_MOTIFS.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  async function ask(question: string) {
    const q = question.trim()
    if (!q || loading) return
    setInput('')
    setError(null)
    setLoading(true)
    setTurns((t) => [...t, { question: q, answers: [] }])
    try {
      const answers = await askPhilosophers(q)
      // 按出生年从古到今排序
      answers.sort(
        (a, b) =>
          (philosopherById.get(a.philosopherId)?.born ?? 0) -
          (philosopherById.get(b.philosopherId)?.born ?? 0),
      )
      setTurns((t) => {
        const next = [...t]
        next[next.length - 1] = { question: q, answers }
        return next
      })
      onHighlight(new Set(answers.map((a) => a.philosopherId)))
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
      })
    } catch {
      setError('追问失败了，稍后再试一次吧')
      setTurns((t) => t.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="motif-body">
      <div className="motif-scroll" ref={scrollRef}>
        {empty ? (
          <div className="motif-hero">
            <div className="motif-hero-title">问一问<br />哲学家们</div>
            <div className="motif-hero-sub">说说困扰你的人生母题，听听古今东西方的哲人怎么说</div>
            <div className="motif-presets" key={page}>
              {visibleMotifs.map((m) => (
                <button key={m.id} className="motif-chip" onClick={() => ask(m.q)}>
                  {m.q}
                </button>
              ))}
            </div>
            <div className="motif-dots">
              {Array.from({ length: pageCount }).map((_, i) => (
                <button
                  key={i}
                  className={i === page ? 'on' : ''}
                  aria-label={`第 ${i + 1} 组问题`}
                  onClick={() => setPage(i)}
                />
              ))}
            </div>
          </div>
        ) : (
          turns.map((turn, i) => (
            <div className="motif-turn" key={i}>
              <div className="motif-q">{turn.question}</div>
              {turn.answers.map((a) => {
                const p = philosopherById.get(a.philosopherId)
                if (!p) return null
                const color = schoolById.get(p.school[0])?.color ?? '#888'
                const schoolName = schoolById.get(p.school[0])?.name
                return (
                  <button
                    className="motif-card"
                    key={a.philosopherId}
                    onClick={() => onSelectPhil(p, true)}
                    title="在左侧时间轴定位并查看详情"
                  >
                    <div className="mc-head">
                      <span className="mc-avatar" style={{ borderColor: color }}>
                        {p.portrait?.url ? (
                          <img
                            src={p.portrait.url}
                            alt=""
                            loading="lazy"
                            style={p.portrait.focus ? { objectPosition: p.portrait.focus } : undefined}
                          />
                        ) : (
                          <span className="mc-avatar-char">{p.name.slice(0, 1)}</span>
                        )}
                      </span>
                      <span className="mc-meta">
                        <span className="mc-name">{p.name}</span>
                        {schoolName && (
                          <span className="mc-school" style={{ color, borderColor: color }}>
                            {schoolName}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="mc-view">{a.view}</div>
                    {a.citation && <div className="mc-cite">— {a.citation}</div>}
                  </button>
                )
              })}
            </div>
          ))
        )}
        {loading && (
          <div className="motif-loading">
            哲学家们正在思考<span className="dots"><i>·</i><i>·</i><i>·</i></span>
          </div>
        )}
        {error && <div className="motif-error">{error}</div>}
      </div>

      <form
        className="motif-input"
        onSubmit={(e) => {
          e.preventDefault()
          ask(input)
        }}
      >
        <textarea
          rows={1}
          placeholder="说说困扰你的人生母题……"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              ask(input)
            }
          }}
        />
        <button type="submit" className="motif-send" disabled={loading || !input.trim()} aria-label="发送">
          <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
            <path d="M2 21l21-9L2 3v7l15 2-15 2z" fill="currentColor" />
          </svg>
        </button>
      </form>
    </div>
  )
}
