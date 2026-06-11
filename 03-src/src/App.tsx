import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { Philosopher, School } from './types'
import { eras, dynastyAt, westStateAt, eraAt } from './data'
import {
  contemporaries,
  yOf,
  yearAt,
  centerX,
  placedById,
  schoolAnchorX,
  fitPpy,
  fitHs,
  rangePpy,
  clampPpy,
  BASE_PPY,
  YEAR_MIN,
  YEAR_MAX,
} from './lib/timeline'
import { Timeline } from './components/Timeline'
import { SyncPanel } from './components/SyncPanel'
import { PhilosopherModal } from './components/PhilosopherModal'
import { SchoolDrawer } from './components/SchoolDrawer'
import { SearchBox, type PickItem } from './components/SearchBox'
import './App.css'

const westEras = eras.filter((e) => e.region === 'west')
const MID_YEAR = (YEAR_MAX + YEAR_MIN) / 2

export default function App() {
  const [cursorYear, setCursorYear] = useState(-500)
  const [ppy, setPpy] = useState(0.3) // 挂载后精确适配为全景
  const [hs, setHs] = useState(1) // 水平缩放，使东西方都在画面
  const [activeEra, setActiveEra] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false) // 窄屏下面板浮层开关
  const [phil, setPhil] = useState<Philosopher | null>(null)
  const [school, setSchool] = useState<School | null>(null)
  const stage = useRef<HTMLDivElement>(null)
  const recenter = useRef<{ year: number; x?: number } | null>(null)

  const { west, east } = useMemo(() => contemporaries(cursorYear), [cursorYear])
  const aliveIds = useMemo(() => new Set([...west, ...east].map((p) => p.id)), [west, east])
  const periods = useMemo(
    () => ({
      eastEra: eraAt(cursorYear, 'east'),
      westEra: eraAt(cursorYear, 'west'),
      dynasty: dynastyAt(cursorYear),
      state: westStateAt(cursorYear),
    }),
    [cursorYear],
  )

  // 缩放后按 recenter 指定的年份/横坐标重新定位（瞬时，避免错位）
  useLayoutEffect(() => {
    const el = stage.current
    const r = recenter.current
    if (!el || !r) return
    el.scrollTop = yOf(r.year, ppy) - el.clientHeight / 2
    if (r.x != null) el.scrollLeft = r.x - el.clientWidth / 2
    recenter.current = null
  }, [ppy])

  // 落地：全景概览（垂直）
  useEffect(() => {
    const el = stage.current
    if (!el) return
    recenter.current = { year: MID_YEAR }
    setPpy(fitPpy(el.clientHeight))
  }, [])

  // 水平自适应：按 stage 可用宽度算缩放，使东西方都在画面里（含窗口 resize）
  useEffect(() => {
    let raf = 0
    function update() {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const el = stage.current
        if (el) setHs(fitHs(el.clientWidth))
      })
    }
    update()
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('resize', update)
      cancelAnimationFrame(raf)
    }
  }, [])

  // hs 变化后保持中轴居中（东西方同时在画面）
  useLayoutEffect(() => {
    const el = stage.current
    if (el) el.scrollLeft = centerX * hs - el.clientWidth / 2
  }, [hs])

  // 统一的「定位 + 可选缩放」：缩放变化走 recenter（瞬时），否则平滑滚动
  function setZoom(np: number, year: number, x?: number) {
    const el = stage.current
    if (!el) return
    np = clampPpy(np)
    if (np === ppy) {
      el.scrollTo({
        top: yOf(year, ppy) - el.clientHeight / 2,
        left: x != null ? x - el.clientWidth / 2 : el.scrollLeft,
        behavior: 'smooth',
      })
    } else {
      recenter.current = { year, x }
      setPpy(np)
    }
  }

  function moveCursor(year: number) {
    setActiveEra(null)
    setCursorYear(year)
  }
  function selectPhil(p: Philosopher, focus = false) {
    moveCursor(p.born)
    setPhil(p)
    const px = placedById.get(p.id)?.x
    if (focus) setZoom(Math.max(ppy, BASE_PPY), p.born, px != null ? px * hs : undefined)
  }
  function selectSchool(s: School, minPpy = 0) {
    moveCursor(s.start)
    setSchool(s)
    setZoom(Math.max(ppy, minPpy), s.start, schoolAnchorX(s) * hs)
  }
  function gotoEra(id: string, start: number, end: number) {
    setActiveEra(id)
    setCursorYear(start)
    const el = stage.current
    if (el) setZoom(rangePpy(start, end, el.clientHeight), (start + end) / 2)
  }
  function gotoAxial() {
    setActiveEra('axial')
    setCursorYear(-500)
    setZoom(BASE_PPY, -500)
  }
  function overview() {
    setActiveEra(null)
    const el = stage.current
    if (el) setZoom(fitPpy(el.clientHeight), MID_YEAR)
  }
  function zoomBy(mult: number) {
    const el = stage.current
    if (!el) return
    setZoom(ppy * mult, yearAt(el.scrollTop + el.clientHeight / 2, ppy))
  }

  function handlePick(p: PickItem) {
    if (p.kind === 'phil') selectPhil(p.item, true)
    else selectSchool(p.item, BASE_PPY)
  }

  return (
    <div className="app">
      <header className="nav">
        <div className="brand">
          <img className="logo" src={`${import.meta.env.BASE_URL}logo.png`} alt="logo" />
          <div className="brand-text">
            <div className="brand-zh">东西方哲学时间线</div>
            <div className="brand-en">A Comparative Timeline of Eastern &amp; Western Philosophy</div>
          </div>
        </div>
        <SearchBox onPick={handlePick} />
      </header>

      <div className="region-labels">
        <span className="rl east">东方 · 中国</span>
        <nav className="eras">
          <button className={`era-btn axial ${activeEra === 'axial' ? 'active' : ''}`} onClick={gotoAxial}>
            ✦ 轴心时代
          </button>
          {westEras.map((e) => (
            <button
              key={e.id}
              className={`era-btn ${activeEra === e.id ? 'active' : ''}`}
              onClick={() => gotoEra(e.id, e.start, e.end)}
            >
              {e.name}
            </button>
          ))}
        </nav>
        <span className="rl west">西方</span>
      </div>

      <div className="stage" ref={stage}>
        <Timeline
          cursorYear={cursorYear}
          setCursorYear={moveCursor}
          ppy={ppy}
          hs={hs}
          aliveIds={aliveIds}
          selectedSchoolId={school?.id ?? null}
          onSelectPhil={selectPhil}
          onSelectSchool={selectSchool}
        />
      </div>

      <div className="zoom-ctrl">
        <button onClick={() => zoomBy(1.4)} title="放大">＋</button>
        <button onClick={() => zoomBy(1 / 1.4)} title="缩小">－</button>
        <button className="zoom-fit" onClick={overview} title="全景概览">全览</button>
      </div>

      <button className="panel-toggle" onClick={() => setPanelOpen((o) => !o)}>
        {panelOpen ? '✕ 关闭' : '同期 ▸'}
      </button>

      <SyncPanel year={cursorYear} west={west} east={east} periods={periods} open={panelOpen} onSelectPhil={selectPhil} />
      <SchoolDrawer
        school={school}
        onClose={() => setSchool(null)}
        onSelectPhil={(p) => {
          setSchool(null)
          selectPhil(p)
        }}
      />
      <PhilosopherModal phil={phil} onClose={() => setPhil(null)} />
    </div>
  )
}
