import { useEffect, useRef, type MouseEvent } from 'react'
import type { School, Philosopher } from '../types'
import { dynasties, westStates, schoolById } from '../data'
import {
  bands,
  placedPhilosophers,
  canvasWidth,
  TOTAL_H,
  HEAD_PAD,
  FOOT_PAD,
  PX_PER_YEAR,
  yOf,
  yearAt,
  centerX,
  axisLeft,
  eastRailX,
  westRailX,
  AXIS_W,
  RAIL_W,
  NODE,
  YEAR_MIN,
  YEAR_MAX,
  shortYear,
} from '../lib/timeline'

const TICKS: number[] = []
for (let y = Math.ceil(YEAR_MIN / 100) * 100; y <= YEAR_MAX; y += 100) TICKS.push(y)

function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${a})`
}

interface Props {
  cursorYear: number
  setCursorYear: (y: number) => void
  aliveIds: Set<string>
  selectedSchoolId: string | null
  onSelectPhil: (p: Philosopher) => void
  onSelectSchool: (s: School) => void
}

export function Timeline({
  cursorYear,
  setCursorYear,
  aliveIds,
  selectedSchoolId,
  onSelectPhil,
  onSelectSchool,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  useEffect(() => {
    function move(e: PointerEvent) {
      if (!dragging.current || !ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const yr = yearAt(e.clientY - rect.top)
      setCursorYear(Math.round(Math.max(YEAR_MIN, Math.min(YEAR_MAX, yr))))
    }
    function up() {
      dragging.current = false
      document.body.classList.remove('dragging')
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [setCursorYear])

  function axisClick(e: MouseEvent) {
    if (!ref.current) return
    const yr = yearAt(e.clientY - ref.current.getBoundingClientRect().top)
    setCursorYear(Math.round(Math.max(YEAR_MIN, Math.min(YEAR_MAX, yr))))
  }

  return (
    <div className="canvas" ref={ref} style={{ width: canvasWidth, height: TOTAL_H }}>
      {/* 顶部哲理文案（滚动到顶可见，居中于时间轴） */}
      <div className="edge-note top" style={{ top: 0, height: HEAD_PAD, left: centerX }}>
        <div className="tn-main">历史仍在续写</div>
        <div className="tn-sub">—— 未来，正等待你留下足迹 ——</div>
      </div>

      {/* 底部哲理文案（远古之源） */}
      <div className="edge-note bottom" style={{ top: TOTAL_H - FOOT_PAD, height: FOOT_PAD, left: centerX }}>
        <div className="tn-main">大道之源，绵延不绝</div>
        <div className="tn-sub">—— 一切思想，皆有其始 ——</div>
      </div>

      {/* 年代网格线 + 标签 */}
      {TICKS.map((y) => (
        <div key={y} className="grid" style={{ top: yOf(y) }}>
          <span className="grid-label" style={{ left: centerX }}>
            {shortYear(y)}
          </span>
        </div>
      ))}

      {/* 中央年代尺（点击设定游标） */}
      <div className="axis-strip" style={{ left: axisLeft, width: AXIS_W }} onClick={axisClick} />

      {/* 东方朝代轨（裁剪进可视范围；进行中→顶部渐隐，远古→底部渐隐） */}
      {dynasties.map((d) => {
        const lo = Math.max(d.year, YEAR_MIN)
        const hi = Math.min(d.endYear as number, YEAR_MAX)
        if (hi <= lo) return null
        const open = (hi >= YEAR_MAX ? ' open-top' : '') + (lo <= YEAR_MIN ? ' open-bottom' : '')
        return (
          <div key={d.id} className={`rail dyn${open}`} style={{ left: eastRailX, top: yOf(hi), width: RAIL_W, height: (hi - lo) * PX_PER_YEAR }}>
            <span>{d.name}</span>
          </div>
        )
      })}

      {/* 西方政权轨（大事记，裁剪进可视范围；进行中→顶部渐隐，远古→底部渐隐） */}
      {westStates.map((s) => {
        const lo = Math.max(s.year, YEAR_MIN)
        const hi = Math.min(s.endYear as number, YEAR_MAX)
        if (hi <= lo) return null
        const open = (hi >= YEAR_MAX ? ' open-top' : '') + (lo <= YEAR_MIN ? ' open-bottom' : '')
        return (
          <div key={s.id} className={`rail state${open}`} style={{ left: westRailX, top: yOf(hi), width: RAIL_W, height: (hi - lo) * PX_PER_YEAR }} title={s.description}>
            <span>{s.name}</span>
          </div>
        )
      })}

      {/* 流派色带 */}
      {bands.map((b) => (
        <button
          key={b.s.id}
          className={`band ${selectedSchoolId === b.s.id ? 'selected' : ''}`}
          onClick={() => onSelectSchool(b.s)}
          style={{
            left: b.left,
            top: b.top,
            width: b.width,
            height: Math.max(b.height, NODE + 24),
            background: hexA(b.s.color, 0.8),
            borderColor: b.s.color,
          }}
        >
          <span className="band-name">{b.s.name}</span>
        </button>
      ))}

      {/* 人物节点 */}
      {placedPhilosophers.map(({ p, x, y }) => {
        const alive = aliveIds.has(p.id)
        const color = schoolById.get(p.school[0])?.color ?? '#888'
        return (
          <button
            key={p.id}
            className={`node ${alive ? 'alive' : 'dim'}`}
            style={{ left: x - NODE / 2, top: y - NODE / 2, width: NODE, height: NODE, borderColor: color }}
            onClick={() => onSelectPhil(p)}
            title={`${p.name} ${p.nameEn}`}
          >
            <span className="node-char">{p.name.slice(0, 1)}</span>
            {p.portrait.url && <img className="node-img" src={p.portrait.url} alt="" loading="lazy" />}
            <span className="node-name">{p.name}</span>
          </button>
        )
      })}

      {/* 同期对照游标 */}
      <div className="cursor" style={{ top: yOf(cursorYear) }}>
        <div
          className="cursor-handle"
          style={{ left: centerX }}
          onPointerDown={() => {
            dragging.current = true
            document.body.classList.add('dragging')
          }}
        >
          {shortYear(cursorYear)}
          <span className="cursor-grip">↕</span>
        </div>
      </div>
    </div>
  )
}
