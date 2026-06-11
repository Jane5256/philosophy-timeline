import { useEffect, useRef, type MouseEvent } from 'react'
import type { School, Philosopher } from '../types'
import { dynasties, westStates, schoolById } from '../data'
import {
  bands,
  placedPhilosophers,
  canvasWidth,
  totalH,
  HEAD_PAD,
  FOOT_PAD,
  BASE_PPY,
  yOf,
  yearAt,
  centerX,
  axisLeft,
  eastRailX,
  westRailX,
  AXIS_W,
  RAIL_W,
  BAND_W,
  LANE_W,
  NODE,
  YEAR_MIN,
  YEAR_MAX,
  shortYear,
} from '../lib/timeline'

function hexA(hex: string, a: number): string {
  const h = hex.replace('#', '')
  return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`
}

interface Props {
  cursorYear: number
  setCursorYear: (y: number) => void
  ppy: number
  hs: number // 水平缩放
  aliveIds: Set<string>
  selectedSchoolId: string | null
  onSelectPhil: (p: Philosopher) => void
  onSelectSchool: (s: School) => void
}

export function Timeline({
  cursorYear,
  setCursorYear,
  ppy,
  hs,
  aliveIds,
  selectedSchoolId,
  onSelectPhil,
  onSelectSchool,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const H = totalH(ppy)

  // 年代刻度步长随缩放自适应
  const step = ppy < 0.45 ? 500 : ppy < 0.9 ? 200 : 100
  const ticks: number[] = []
  for (let y = Math.ceil(YEAR_MIN / step) * step; y <= YEAR_MAX; y += step) ticks.push(y)

  // 节点尺寸：受垂直缩放 ppy 与列宽（水平缩放 hs）双重约束
  const nodeSize = Math.max(12, Math.min(NODE, (NODE * ppy) / BASE_PPY, LANE_W * hs * 0.92))
  const showName = ppy >= 1.0
  const axisW = AXIS_W * hs
  const railW = RAIL_W * hs

  useEffect(() => {
    function move(e: PointerEvent) {
      if (!dragging.current || !ref.current) return
      const yr = yearAt(e.clientY - ref.current.getBoundingClientRect().top, ppy)
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
  }, [setCursorYear, ppy])

  function axisClick(e: MouseEvent) {
    if (!ref.current) return
    const yr = yearAt(e.clientY - ref.current.getBoundingClientRect().top, ppy)
    setCursorYear(Math.round(Math.max(YEAR_MIN, Math.min(YEAR_MAX, yr))))
  }

  return (
    <div className="canvas" ref={ref} style={{ width: canvasWidth * hs, height: H }}>
      {/* 顶部 / 底部哲理文案 */}
      <div className="edge-note top" style={{ top: 0, height: HEAD_PAD, left: centerX * hs }}>
        <div className="tn-main">历史仍在续写</div>
        <div className="tn-sub">—— 未来，正等待你留下足迹 ——</div>
      </div>
      <div className="edge-note bottom" style={{ top: H - FOOT_PAD, height: FOOT_PAD, left: centerX * hs }}>
        <div className="tn-main">大道之源，绵延不绝</div>
        <div className="tn-sub">—— 一切思想，皆有其始 ——</div>
      </div>

      {/* 年代网格线 + 标签 */}
      {ticks.map((y) => (
        <div key={y} className="grid" style={{ top: yOf(y, ppy) }}>
          <span className="grid-label" style={{ left: centerX * hs }}>
            {shortYear(y)}
          </span>
        </div>
      ))}

      {/* 中央年代尺 */}
      <div className="axis-strip" style={{ left: axisLeft * hs, width: axisW }} onClick={axisClick} />

      {/* 东方朝代轨 */}
      {dynasties.map((d) => {
        const lo = Math.max(d.year, YEAR_MIN)
        const hi = Math.min(d.endYear as number, YEAR_MAX)
        if (hi <= lo) return null
        const open = (hi >= YEAR_MAX ? ' open-top' : '') + (lo <= YEAR_MIN ? ' open-bottom' : '')
        return (
          <div key={d.id} className={`rail dyn${open}`} style={{ left: eastRailX * hs, top: yOf(hi, ppy), width: railW, height: (hi - lo) * ppy }}>
            <span>{d.name}</span>
          </div>
        )
      })}

      {/* 西方政权轨 */}
      {westStates.map((s) => {
        const lo = Math.max(s.year, YEAR_MIN)
        const hi = Math.min(s.endYear as number, YEAR_MAX)
        if (hi <= lo) return null
        const open = (hi >= YEAR_MAX ? ' open-top' : '') + (lo <= YEAR_MIN ? ' open-bottom' : '')
        return (
          <div key={s.id} className={`rail state${open}`} style={{ left: westRailX * hs, top: yOf(hi, ppy), width: railW, height: (hi - lo) * ppy }} title={s.description}>
            <span>{s.name}</span>
          </div>
        )
      })}

      {/* 流派色带 */}
      {bands.map((b) => {
        const top = yOf(b.s.end, ppy)
        const height = Math.max((b.s.end - b.s.start) * ppy, 12)
        return (
          <button
            key={b.s.id}
            className={`band ${selectedSchoolId === b.s.id ? 'selected' : ''}`}
            onClick={() => onSelectSchool(b.s)}
            style={{ left: b.left * hs, top, width: BAND_W * hs, height, background: hexA(b.s.color, 0.8), borderColor: b.s.color }}
          >
            {height > 34 && BAND_W * hs > 18 && <span className="band-name">{b.s.name}</span>}
          </button>
        )
      })}

      {/* 人物节点 */}
      {placedPhilosophers.map(({ p, x }) => {
        const alive = aliveIds.has(p.id)
        const color = schoolById.get(p.school[0])?.color ?? '#888'
        const y = yOf(p.born, ppy)
        const showImg = nodeSize >= 24 && !!p.portrait.url
        const showChar = nodeSize >= 20 && !showImg
        return (
          <button
            key={p.id}
            className={`node ${alive ? 'alive' : 'dim'}`}
            style={{ left: x * hs - nodeSize / 2, top: y - nodeSize / 2, width: nodeSize, height: nodeSize, borderColor: color, background: showImg ? '#fff' : color }}
            onClick={() => onSelectPhil(p)}
            title={`${p.name} ${p.nameEn}`}
          >
            {showChar && <span className="node-char" style={{ fontSize: Math.round(nodeSize * 0.42) }}>{p.name.slice(0, 1)}</span>}
            {showImg && (
              <img className="node-img" src={p.portrait.url} alt="" loading="lazy" style={p.portrait.focus ? { objectPosition: p.portrait.focus } : undefined} />
            )}
            {showName && alive && <span className="node-name">{p.name}</span>}
          </button>
        )
      })}

      {/* 同期对照游标 */}
      <div className="cursor" style={{ top: yOf(cursorYear, ppy) }}>
        <div
          className="cursor-handle"
          style={{ left: centerX * hs }}
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
