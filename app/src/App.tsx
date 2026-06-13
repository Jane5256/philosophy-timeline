import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { Philosopher, School } from './types'
import { eras, dynastyAt, westStateAt, eraAt, synchronyAt } from './data'
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
import { MotifPanel } from './components/MotifPanel'
import { PhilosopherModal } from './components/PhilosopherModal'
import { SchoolDrawer } from './components/SchoolDrawer'
import { SearchBox, type PickItem } from './components/SearchBox'
import './App.css'

const westEras = eras.filter((e) => e.region === 'west')
const MID_YEAR = (YEAR_MAX + YEAR_MIN) / 2
const EMPTY_IDS = new Set<string>() // 非人生问题 tab 时不显示追问高亮（稳定引用，避免重渲染）

export default function App() {
  const [cursorYear, setCursorYear] = useState(-500)
  const [ppy, setPpy] = useState(0.3) // 挂载后精确定位到轴心时代
  const [hs, setHs] = useState(1) // 水平缩放，使东西方都在画面
  const [activeEra, setActiveEra] = useState<string | null>('axial') // 默认选中轴心时代
  const [panelOpen, setPanelOpen] = useState(false) // 窄屏下面板浮层开关
  const [panelTab, setPanelTab] = useState<'sync' | 'motif'>('sync') // 右侧面板：同期对照 / 人生问题
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set()) // 人生问题追问命中的哲学家
  const [phil, setPhil] = useState<Philosopher | null>(null)
  const [school, setSchool] = useState<School | null>(null)
  const [fitMode, setFitMode] = useState(false) // 是否处于「全览」态：默认 false（默认是轴心时代细看）
  const stage = useRef<HTMLDivElement>(null)
  const recenter = useRef<{ year: number; x?: number } | null>(null)
  // resize 监听器闭包内读取最新值用
  const fitModeRef = useRef(fitMode)
  const ppyRef = useRef(ppy)
  fitModeRef.current = fitMode
  ppyRef.current = ppy

  const { west, east } = useMemo(() => contemporaries(cursorYear), [cursorYear])
  const synchrony = useMemo(() => synchronyAt(cursorYear), [cursorYear])
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

  // 落地：默认定位到「轴心时代」（公元前500年），而非全景概览
  useEffect(() => {
    const el = stage.current
    if (!el) return
    recenter.current = { year: -500 }
    setActiveEra('axial')
    setFitMode(false)
    setPpy(BASE_PPY)
  }, [])

  // 窗口自适应：水平始终按宽度重算；若处于全览态，纵向也随高度重算（含窗口 resize）
  useEffect(() => {
    let raf = 0
    function update() {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const el = stage.current
        if (!el) return
        setHs(fitHs(el.clientWidth))
        if (fitModeRef.current) {
          const np = fitPpy(el.clientHeight)
          if (np !== ppyRef.current) {
            recenter.current = { year: MID_YEAR }
            setPpy(np)
          }
        }
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
    if (focus) {
      setFitMode(false)
      setZoom(Math.max(ppy, BASE_PPY), p.born, px != null ? px * hs : undefined)
    }
  }
  function selectSchool(s: School, minPpy = 0) {
    moveCursor(s.start)
    setSchool(s)
    setFitMode(false)
    setZoom(Math.max(ppy, minPpy), s.start, schoolAnchorX(s) * hs)
  }
  function gotoEra(id: string, start: number, end: number) {
    setActiveEra(id)
    setCursorYear(start)
    const el = stage.current
    if (el) {
      setFitMode(false)
      setZoom(rangePpy(start, end, el.clientHeight), (start + end) / 2)
    }
  }
  function gotoAxial() {
    setActiveEra('axial')
    setCursorYear(-500)
    setFitMode(false)
    setZoom(BASE_PPY, -500)
  }
  function overview() {
    setActiveEra(null)
    const el = stage.current
    if (el) {
      setFitMode(true)
      setZoom(fitPpy(el.clientHeight), MID_YEAR)
    }
  }
  function zoomBy(mult: number) {
    const el = stage.current
    if (!el) return
    setFitMode(false)
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
          highlightIds={panelTab === 'motif' ? highlightIds : EMPTY_IDS}
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
        {panelOpen ? '✕ 关闭' : '面板 ▸'}
      </button>

      <aside className={`side-panel ${panelOpen ? 'open' : ''}`}>
        <div className="panel-tabs">
          <button
            className={`pt ${panelTab === 'sync' ? 'active' : ''}`}
            onClick={() => setPanelTab('sync')}
          >
            同期对照
          </button>
          <button
            className={`pt ${panelTab === 'motif' ? 'active' : ''}`}
            onClick={() => setPanelTab('motif')}
          >
            人生问题
          </button>
        </div>
        {/* 两个面板都常驻挂载，仅切换显隐，保留各自状态（对话记录只在刷新页面时重置） */}
        <div className="panel-pane" hidden={panelTab !== 'sync'}>
          <SyncPanel year={cursorYear} west={west} east={east} periods={periods} synchrony={synchrony} onSelectPhil={selectPhil} />
        </div>
        <div className="panel-pane" hidden={panelTab !== 'motif'}>
          <MotifPanel onSelectPhil={selectPhil} onHighlight={setHighlightIds} />
        </div>
      </aside>
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
