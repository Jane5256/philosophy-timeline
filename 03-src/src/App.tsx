import { useEffect, useMemo, useRef, useState } from 'react'
import type { Philosopher, School } from './types'
import { eras, dynastyAt, westStateAt, eraAt } from './data'
import { contemporaries, yOf, centerX, placedById, schoolLaneX, LANE_W } from './lib/timeline'
import { Timeline } from './components/Timeline'
import { SyncPanel } from './components/SyncPanel'
import { PhilosopherModal } from './components/PhilosopherModal'
import { SchoolDrawer } from './components/SchoolDrawer'
import { SearchBox, type PickItem } from './components/SearchBox'
import './App.css'

const westEras = eras.filter((e) => e.region === 'west')

export default function App() {
  const [cursorYear, setCursorYear] = useState(-500)
  const [activeEra, setActiveEra] = useState<string | null>('axial')
  const [phil, setPhil] = useState<Philosopher | null>(null)
  const [school, setSchool] = useState<School | null>(null)
  const stage = useRef<HTMLDivElement>(null)

  // 游标因「非时代导航」的交互（拖动 / 点人物 / 点学派）而移动时，清除时代高亮
  function moveCursor(year: number) {
    setActiveEra(null)
    setCursorYear(year)
  }

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

  function scrollToPoint(x: number, y: number) {
    const el = stage.current
    if (!el) return
    el.scrollTo({ left: x - el.clientWidth / 2, top: y - el.clientHeight / 2, behavior: 'smooth' })
  }
  function scrollToYear(year: number) {
    const el = stage.current
    if (!el) return
    el.scrollTo({ top: yOf(year) - el.clientHeight / 2, behavior: 'smooth' })
  }

  // 选中人物：游标跟到出生年（关弹窗后仍可看同期），并打开详情
  function selectPhil(p: Philosopher) {
    moveCursor(p.born)
    setPhil(p)
  }
  // 选中学派：游标定位到起始年、滚动到该学派、打开详情
  function selectSchool(s: School) {
    moveCursor(s.start)
    setSchool(s)
    scrollToPoint(schoolLaneX(s) + LANE_W / 2, yOf(s.start))
  }
  // 时代导航：高亮该时代，游标与滚动呼应其起始年
  function gotoEra(id: string, startYear: number) {
    setActiveEra(id)
    setCursorYear(startYear)
    scrollToYear(startYear)
  }

  function handlePick(p: PickItem) {
    if (p.kind === 'phil') {
      const pl = placedById.get(p.item.id)
      selectPhil(p.item)
      if (pl) scrollToPoint(pl.x, pl.y)
    } else {
      selectSchool(p.item)
    }
  }

  useEffect(() => {
    const el = stage.current
    if (!el) return
    el.scrollTop = yOf(-500) - el.clientHeight / 2
    el.scrollLeft = centerX - el.clientWidth / 2
  }, [])

  return (
    <div className="app">
      <header className="nav">
        <div className="brand">
          <img className="logo" src="/logo.png" alt="logo" />
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
          <button
            className={`era-btn axial ${activeEra === 'axial' ? 'active' : ''}`}
            onClick={() => gotoEra('axial', -500)}
          >
            ✦ 轴心时代
          </button>
          {westEras.map((e) => (
            <button
              key={e.id}
              className={`era-btn ${activeEra === e.id ? 'active' : ''}`}
              onClick={() => gotoEra(e.id, e.start)}
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
          aliveIds={aliveIds}
          selectedSchoolId={school?.id ?? null}
          onSelectPhil={selectPhil}
          onSelectSchool={selectSchool}
        />
      </div>
      <div className="fade-top" />
      <div className="fade-bottom" />

      <SyncPanel year={cursorYear} west={west} east={east} periods={periods} onSelectPhil={selectPhil} />
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
