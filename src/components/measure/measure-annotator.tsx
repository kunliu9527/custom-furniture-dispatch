import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type {
  MeasureAnnotation as Annotation,
  DimensionAnnotation,
  MeasurePhotoView as MeasurePhoto,
  MeasurePoint as Point,
  MeasureToolMode as ToolMode,
  MeasureUnit as Unit,
} from "@/lib/measure/types";
import { annotationLabel, measureUid as uid } from "@/lib/measure/types";
import {
  drawAnnotation,
  hitTestAnnotation,
} from "@/lib/measure/canvas-draw";
import "./measure-annotator.css";

const COLORS = ['#e85d04', '#0d6e6e', '#2b2d42', '#bc4749', '#386641']
const TOOLS: { id: ToolMode; label: string }[] = [
  { id: 'select', label: '选择' },
  { id: 'dimension', label: '尺寸' },
  { id: 'arrow', label: '箭头' },
  { id: 'text', label: '文字' },
  { id: 'pen', label: '涂鸦' },
]

interface AnnotatorProps {
  photo: MeasurePhoto
  onSave: (annotations: Annotation[], meta: { name: string; room: string }) => void
  onBack: () => void
  /** 当前第几张（从 0 开始） */
  photoIndex?: number
  photoCount?: number
  onNavigate?: (direction: -1 | 1) => void
}

type DraftLine = { x1: number; y1: number; x2: number; y2: number } | null

export function MeasureAnnotator({
  photo,
  onSave,
  onBack,
  photoIndex = 0,
  photoCount = 1,
  onNavigate,
}: AnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const drawingPen = useRef(false)
  const swipeStart = useRef<{ x: number; y: number } | null>(null)
  const annotationsRef = useRef<Annotation[]>(photo.annotations)
  const selectedIdRef = useRef<string | null>(null)
  const draftStartRef = useRef<Point | null>(null)
  const hoverRef = useRef<Point | null>(null)
  const toolRef = useRef<ToolMode>('dimension')
  const colorRef = useRef(COLORS[0])
  const lineDragRef = useRef<{
    start: Point
    pointerId: number
    moved: boolean
  } | null>(null)
  const penPointsRef = useRef<Point[]>([])
  const rafRef = useRef(0)

  const [annotations, setAnnotations] = useState<Annotation[]>(photo.annotations)
  const [history, setHistory] = useState<Annotation[][]>([])
  const [name, setName] = useState(photo.name)
  const [room, setRoom] = useState(photo.room)
  const [tool, setTool] = useState<ToolMode>('dimension')
  const [unit, setUnit] = useState<Unit>('mm')
  const [color, setColor] = useState(COLORS[0])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draftStart, setDraftStart] = useState<Point | null>(null)
  const [pendingLine, setPendingLine] = useState<DraftLine>(null)
  const [pendingKind, setPendingKind] = useState<'dimension' | 'arrow' | 'text' | null>(null)
  const [valueInput, setValueInput] = useState('')
  const [noteInput, setNoteInput] = useState('')
  const [textPos, setTextPos] = useState<Point | null>(null)
  const [ready, setReady] = useState(false)
  const [naturalSize, setNaturalSize] = useState({ w: 1, h: 1 })
  const [dirty, setDirty] = useState(false)

  annotationsRef.current = annotations
  selectedIdRef.current = selectedId
  draftStartRef.current = draftStart
  toolRef.current = tool
  colorRef.current = color

  // 切换照片时重置编辑状态
  useEffect(() => {
    setAnnotations(photo.annotations)
    setHistory([])
    setName(photo.name)
    setRoom(photo.room)
    setSelectedId(null)
    setDraftStart(null)
    hoverRef.current = null
    lineDragRef.current = null
    penPointsRef.current = []
    setPendingLine(null)
    setPendingKind(null)
    setValueInput('')
    setNoteInput('')
    setTextPos(null)
    setDirty(false)
    setReady(false)
    const img = new Image()
    img.onload = () => {
      imageRef.current = img
      setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
      setReady(true)
    }
    img.onerror = () => setReady(false)
    img.src = photo.imageDataUrl
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photo.id, photo.imageDataUrl])

  function flushSaveIfNeeded() {
    if (!dirty) return
    onSave(annotations, { name: name.trim() || '现场照片', room: room.trim() })
    setDirty(false)
  }

  function handleNavigate(direction: -1 | 1) {
    if (!onNavigate) return
    if (pendingKind) {
      alert('请先完成当前标注填写，或取消后再切换')
      return
    }
    flushSaveIfNeeded()
    onNavigate(direction)
  }

  function pushHistory(next: Annotation[]) {
    setHistory((h) => [...h.slice(-29), annotations])
    setAnnotations(next)
    setDirty(true)
  }

  function undo() {
    setHistory((h) => {
      if (!h.length) return h
      const prev = h[h.length - 1]
      setAnnotations(prev)
      setSelectedId(null)
      setDirty(true)
      return h.slice(0, -1)
    })
  }

  function paintCanvas() {
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img || !canvas.width || !canvas.height) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    const sx = canvas.width / img.naturalWidth
    const sy = canvas.height / img.naturalHeight
    const list = annotationsRef.current
    const selected = selectedIdRef.current
    const currentTool = toolRef.current
    const currentColor = colorRef.current
    const start = draftStartRef.current
    const hover = hoverRef.current

    for (const a of list) {
      // 涂鸦拖拽中用 ref 最新点，避免每帧 setState
      if (
        drawingPen.current &&
        a.id === selected &&
        a.kind === 'pen' &&
        penPointsRef.current.length > 0
      ) {
        drawAnnotation(
          ctx,
          { ...a, points: penPointsRef.current },
          sx,
          sy,
          true,
        )
        continue
      }
      drawAnnotation(ctx, a, sx, sy, a.id === selected)
    }

    if (start && hover && (currentTool === 'dimension' || currentTool === 'arrow')) {
      ctx.save()
      ctx.strokeStyle = currentColor
      ctx.lineWidth = Math.max(2, canvas.width * 0.0025)
      ctx.setLineDash([6, 4])
      ctx.beginPath()
      ctx.moveTo(start.x * sx, start.y * sy)
      ctx.lineTo(hover.x * sx, hover.y * sy)
      ctx.stroke()
      ctx.restore()
    }
  }

  function schedulePaint() {
    if (rafRef.current) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0
      paintCanvas()
    })
  }

  // 仅在容器尺寸变化时改 canvas 缓冲；绘制单独触发，避免 pointermove 反复 resize 导致延迟和错位
  useEffect(() => {
    if (!ready) return
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    const img = imageRef.current
    if (!canvas || !wrap || !img) return

    const resize = () => {
      const maxW = Math.max(
        wrap.clientWidth,
        wrap.parentElement?.clientWidth ?? 0,
        Math.min(window.innerWidth - 24, 1040),
      )
      // 手机端优先用画布容器实际高度（全屏 flex 剩余空间），避免再按 66vh 二次裁切
      const wrapH = wrap.clientHeight
      const maxH =
        window.innerWidth < 640 && wrapH > 120
          ? wrapH
          : Math.min(
              window.innerHeight * (window.innerWidth < 640 ? 0.66 : 0.68),
              window.innerWidth < 640 ? 560 : 760,
            )
      // 按容器等比适配；手机端尽量用满宽度以放大操作区
      const scale = Math.min(
        maxW / Math.max(1, img.naturalWidth),
        maxH / Math.max(1, img.naturalHeight),
      )
      const nextW = Math.max(1, Math.floor(img.naturalWidth * scale))
      const nextH = Math.max(1, Math.floor(img.naturalHeight * scale))
      if (canvas.width !== nextW || canvas.height !== nextH) {
        canvas.width = nextW
        canvas.height = nextH
      }
      // 明确 CSS 尺寸，避免仅依赖 intrinsic 在部分 WebView 上测量不准
      canvas.style.width = `${nextW}px`
      canvas.style.height = `${nextH}px`
      paintCanvas()
    }

    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)
    window.addEventListener('resize', resize)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', resize)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, naturalSize.w, naturalSize.h])

  useEffect(() => {
    if (!ready) return
    paintCanvas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, annotations, selectedId, draftStart, color, tool])

  function toImageCoords(clientX: number, clientY: number): Point | null {
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img || !canvas.width || !canvas.height) return null
    const rect = canvas.getBoundingClientRect()
    if (rect.width < 1 || rect.height < 1) return null
    // 用显示尺寸映射到自然像素，避免 CSS 缩放后错位
    const x = ((clientX - rect.left) / rect.width) * img.naturalWidth
    const y = ((clientY - rect.top) / rect.height) * img.naturalHeight
    return {
      x: Math.max(0, Math.min(img.naturalWidth, x)),
      y: Math.max(0, Math.min(img.naturalHeight, y)),
    }
  }

  function hitTest(x: number, y: number): string | null {
    const threshold = Math.max(naturalSize.w, naturalSize.h) * 0.018
    const list = annotationsRef.current
    for (let i = list.length - 1; i >= 0; i--) {
      if (hitTestAnnotation(list[i], x, y, threshold)) return list[i].id
    }
    return null
  }

  function beginPendingLine(line: NonNullable<DraftLine>, kind: 'dimension' | 'arrow') {
    setPendingLine(line)
    setPendingKind(kind)
    setValueInput('')
    setNoteInput('')
    setDraftStart(null)
    draftStartRef.current = null
    hoverRef.current = null
    lineDragRef.current = null
    schedulePaint()
  }

  function onPointerDown(e: ReactPointerEvent) {
    if (pendingKind) return
    const canvas = canvasRef.current
    if (!canvas) return
    e.preventDefault()
    canvas.setPointerCapture(e.pointerId)
    const pt = toImageCoords(e.clientX, e.clientY)
    if (!pt) return

    if (tool === 'select') {
      setSelectedId(hitTest(pt.x, pt.y))
      return
    }

    if (tool === 'text') {
      setTextPos(pt)
      setPendingKind('text')
      setValueInput('')
      setSelectedId(null)
      return
    }

    if (tool === 'pen') {
      drawingPen.current = true
      penPointsRef.current = [pt]
      const stroke: Annotation = {
        kind: 'pen',
        id: uid(),
        color,
        width: Math.max(3, Math.max(naturalSize.w, naturalSize.h) * 0.003),
        points: [pt],
      }
      setHistory((h) => [...h.slice(-29), annotations])
      setAnnotations((prev) => [...prev, stroke])
      setSelectedId(stroke.id)
      setDirty(true)
      return
    }

    // dimension / arrow：支持拖拽画线；轻点则保留两点点击模式
    const hit = hitTest(pt.x, pt.y)
    if (hit && !draftStart) {
      setSelectedId(hit)
      setTool('select')
      return
    }

    if (!draftStart) {
      setDraftStart(pt)
      draftStartRef.current = pt
      hoverRef.current = pt
      setSelectedId(null)
      lineDragRef.current = { start: pt, pointerId: e.pointerId, moved: false }
      schedulePaint()
    } else {
      beginPendingLine(
        { x1: draftStart.x, y1: draftStart.y, x2: pt.x, y2: pt.y },
        tool === 'arrow' ? 'arrow' : 'dimension',
      )
    }
  }

  function onPointerMove(e: ReactPointerEvent) {
    const pt = toImageCoords(e.clientX, e.clientY)
    if (!pt) return

    if (tool === 'pen' && drawingPen.current && selectedId) {
      const pts = penPointsRef.current
      const last = pts[pts.length - 1]
      if (!last || Math.hypot(pt.x - last.x, pt.y - last.y) >= 1.5) {
        penPointsRef.current = [...pts, pt]
        schedulePaint()
      }
      return
    }

    if (draftStart && (tool === 'dimension' || tool === 'arrow')) {
      hoverRef.current = pt
      const drag = lineDragRef.current
      if (drag && drag.pointerId === e.pointerId) {
        const dist = Math.hypot(pt.x - drag.start.x, pt.y - drag.start.y)
        const threshold = Math.max(naturalSize.w, naturalSize.h) * 0.012
        if (dist >= threshold) drag.moved = true
      }
      schedulePaint()
    }
  }

  function onPointerUp(e: ReactPointerEvent) {
    if (drawingPen.current) {
      drawingPen.current = false
      const pts = penPointsRef.current
      const sid = selectedIdRef.current
      if (sid && pts.length > 0) {
        setAnnotations((prev) =>
          prev.map((a) =>
            a.id === sid && a.kind === 'pen' ? { ...a, points: pts } : a,
          ),
        )
      }
      penPointsRef.current = []
      setDirty(true)
      return
    }

    const drag = lineDragRef.current
    if (
      drag &&
      drag.pointerId === e.pointerId &&
      drag.moved &&
      (tool === 'dimension' || tool === 'arrow')
    ) {
      const pt = toImageCoords(e.clientX, e.clientY)
      if (pt) {
        beginPendingLine(
          { x1: drag.start.x, y1: drag.start.y, x2: pt.x, y2: pt.y },
          tool === 'arrow' ? 'arrow' : 'dimension',
        )
        return
      }
    }
    lineDragRef.current = null
  }

  function confirmPending() {
    if (pendingKind === 'text' && textPos) {
      if (!valueInput.trim()) return
      const next: Annotation = {
        kind: 'text',
        id: uid(),
        x: textPos.x,
        y: textPos.y,
        text: valueInput.trim(),
        color,
      }
      pushHistory([...annotations, next])
      setSelectedId(next.id)
      resetPending()
      return
    }

    if (!pendingLine) return

    if (pendingKind === 'arrow') {
      const next: Annotation = {
        kind: 'arrow',
        id: uid(),
        ...pendingLine,
        note: noteInput.trim() || undefined,
        color,
      }
      pushHistory([...annotations, next])
      setSelectedId(next.id)
      resetPending()
      return
    }

    if (pendingKind === 'dimension') {
      if (!valueInput.trim()) return
      const next: DimensionAnnotation = {
        kind: 'dimension',
        id: uid(),
        ...pendingLine,
        value: valueInput.trim(),
        unit,
        note: noteInput.trim() || undefined,
        color,
      }
      pushHistory([...annotations, next])
      setSelectedId(next.id)
      resetPending()
    }
  }

  function resetPending() {
    setPendingLine(null)
    setPendingKind(null)
    setTextPos(null)
    setValueInput('')
    setNoteInput('')
    hoverRef.current = null
    lineDragRef.current = null
  }

  function deleteSelected() {
    if (!selectedId) return
    pushHistory(annotations.filter((a) => a.id !== selectedId))
    setSelectedId(null)
  }

  function updateSelectedDimension(patch: Partial<DimensionAnnotation>) {
    if (!selectedId) return
    setAnnotations((prev) =>
      prev.map((a) =>
        a.id === selectedId && a.kind === 'dimension' ? { ...a, ...patch } : a,
      ),
    )
    setDirty(true)
  }

  function handleSave() {
    onSave(annotations, { name: name.trim() || '现场照片', room: room.trim() })
    setDirty(false)
    // 保存后回到归档/选图页，方便立即开始下一张
    onBack()
  }

  function handleBack() {
    if (dirty && !confirm('有未保存的修改，确定返回？')) return
    onBack()
  }

  const canPrev = Boolean(onNavigate) && photoIndex > 0
  const canNext = Boolean(onNavigate) && photoIndex < photoCount - 1
  const showPager = photoCount > 1

  const selected = annotations.find((a) => a.id === selectedId)
  const hint =
    tool === 'select'
      ? '点击标注可选中，可在下方编辑尺寸'
      : tool === 'dimension'
        ? draftStart
          ? '拖到终点松手，或再点一下确定终点'
          : '按住拖动画尺寸线，或点两点'
        : tool === 'arrow'
          ? draftStart
            ? '拖到终点松手，或再点一下确定箭头终点'
            : '按住拖动画箭头，或点两点'
          : tool === 'text'
            ? '点击照片放置文字说明'
            : '按住拖动画涂鸦'

  return (
    <div className="measure-root editor-page">
      <header className="topbar">
        <button type="button" className="btn btn-ghost" onClick={handleBack}>
          ← 返回
        </button>
        {showPager ? (
          <div className="photo-pager">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={!canPrev}
              onClick={() => handleNavigate(-1)}
              aria-label="上一张"
            >
              ‹
            </button>
            <span className="pager-index">
              {photoIndex + 1}/{photoCount}
            </span>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={!canNext}
              onClick={() => handleNavigate(1)}
              aria-label="下一张"
            >
              ›
            </button>
          </div>
        ) : null}
        <div className="topbar-actions">
          <button type="button" className="btn btn-ghost" disabled={!history.length} onClick={undo}>
            撤销
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            {dirty ? '保存并继续' : '完成'}
          </button>
        </div>
      </header>

      <div className="editor-meta">
        <label>
          <span>照片名称</span>
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setDirty(true)
            }}
            placeholder="如：客厅东墙"
          />
        </label>
        <label>
          <span>房间</span>
          <input
            value={room}
            onChange={(e) => {
              setRoom(e.target.value)
              setDirty(true)
            }}
            placeholder="如：主卧"
            list="room-suggestions"
          />
          <datalist id="room-suggestions">
            <option value="客厅" />
            <option value="主卧" />
            <option value="次卧" />
            <option value="厨房" />
            <option value="卫生间" />
            <option value="阳台" />
            <option value="餐厅" />
            <option value="玄关" />
          </datalist>
        </label>
      </div>

      <div className="toolbar">
        <div className="tool-group tools">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`chip ${tool === t.id ? 'active' : ''}`}
              onClick={() => {
                setTool(t.id)
                setDraftStart(null)
                draftStartRef.current = null
                hoverRef.current = null
                lineDragRef.current = null
                schedulePaint()
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="tool-group">
          <span className="tool-label">单位</span>
          {(['mm', 'cm', 'm'] as Unit[]).map((u) => (
            <button
              key={u}
              type="button"
              className={`chip ${unit === u ? 'active' : ''}`}
              onClick={() => setUnit(u)}
            >
              {u}
            </button>
          ))}
        </div>
        <div className="tool-group">
          <span className="tool-label">颜色</span>
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`swatch ${color === c ? 'active' : ''}`}
              style={{ background: c }}
              aria-label={c}
              onClick={() => setColor(c)}
            />
          ))}
        </div>
        <button
          type="button"
          className="btn btn-danger"
          disabled={!selectedId}
          onClick={deleteSelected}
        >
          删除选中
        </button>
      </div>

      <p className="hint">
        {hint}
        {showPager ? ' · 可点「上一张/下一张」切换，切换时自动保存' : ''}
      </p>

      <div className="canvas-wrap" ref={wrapRef}>
        {!ready && <div className="canvas-loading">加载图片…</div>}
        {showPager && canPrev ? (
          <button
            type="button"
            className="canvas-nav canvas-nav-prev"
            aria-label="上一张"
            onClick={() => handleNavigate(-1)}
          >
            ‹
          </button>
        ) : null}
        {showPager && canNext ? (
          <button
            type="button"
            className="canvas-nav canvas-nav-next"
            aria-label="下一张"
            onClick={() => handleNavigate(1)}
          >
            ›
          </button>
        ) : null}
        <canvas
          ref={canvasRef}
          className="measure-canvas"
          onPointerDown={(e) => {
            if (tool === 'select' && showPager) {
              swipeStart.current = { x: e.clientX, y: e.clientY }
            } else {
              swipeStart.current = null
            }
            onPointerDown(e)
          }}
          onPointerMove={onPointerMove}
          onPointerUp={(e) => {
            const start = swipeStart.current
            swipeStart.current = null
            onPointerUp(e)
            if (!start || tool !== 'select' || !showPager || pendingKind) return
            const dx = e.clientX - start.x
            const dy = e.clientY - start.y
            if (Math.abs(dx) < 72 || Math.abs(dx) < Math.abs(dy) * 1.4) return
            if (dx < 0 && canNext) handleNavigate(1)
            if (dx > 0 && canPrev) handleNavigate(-1)
          }}
          onPointerCancel={(e) => onPointerUp(e)}
        />
      </div>

      {selected?.kind === 'dimension' && (
        <div className="edit-panel">
          <h4>编辑尺寸</h4>
          <div className="edit-row">
            <label>
              <span>数值</span>
              <input
                value={selected.value}
                onChange={(e) => updateSelectedDimension({ value: e.target.value })}
              />
            </label>
            <label>
              <span>单位</span>
              <select
                value={selected.unit}
                onChange={(e) => updateSelectedDimension({ unit: e.target.value as Unit })}
              >
                <option value="mm">mm</option>
                <option value="cm">cm</option>
                <option value="m">m</option>
              </select>
            </label>
            <label>
              <span>说明</span>
              <input
                value={selected.note || ''}
                onChange={(e) =>
                  updateSelectedDimension({ note: e.target.value || undefined })
                }
                placeholder="如：窗洞净宽"
              />
            </label>
          </div>
        </div>
      )}

      {selected && selected.kind !== 'dimension' && (
        <div className="selected-panel">
          <strong>{annotationLabel(selected)}</strong>
        </div>
      )}

      <ul className="anno-list">
        {annotations.map((a, i) => (
          <li key={a.id}>
            <button
              type="button"
              className={a.id === selectedId ? 'active' : ''}
              onClick={() => {
                setSelectedId(a.id)
                setTool('select')
              }}
            >
              <i style={{ background: a.color }} />
              <span>
                #{i + 1} [{a.kind === 'dimension' ? '尺寸' : a.kind === 'arrow' ? '箭头' : a.kind === 'text' ? '文字' : '涂鸦'}]{' '}
                {annotationLabel(a)}
              </span>
            </button>
          </li>
        ))}
        {annotations.length === 0 && (
          <li className="empty">暂无标注，选择「尺寸」工具后在图上点两点开始</li>
        )}
      </ul>

      {pendingKind && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>
              {pendingKind === 'dimension'
                ? '填写尺寸'
                : pendingKind === 'arrow'
                  ? '箭头说明'
                  : '添加文字'}
            </h3>
            {pendingKind === 'dimension' && (
              <label>
                <span>数值</span>
                <input
                  autoFocus
                  inputMode="decimal"
                  value={valueInput}
                  onChange={(e) => setValueInput(e.target.value)}
                  placeholder={`例如 2400（${unit}）`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmPending()
                  }}
                />
              </label>
            )}
            {pendingKind === 'text' && (
              <label>
                <span>文字内容</span>
                <input
                  autoFocus
                  value={valueInput}
                  onChange={(e) => setValueInput(e.target.value)}
                  placeholder="如：此处有梁"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmPending()
                  }}
                />
              </label>
            )}
            {(pendingKind === 'dimension' || pendingKind === 'arrow') && (
              <label>
                <span>{pendingKind === 'arrow' ? '说明（可选）' : '说明（可选）'}</span>
                <input
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder={pendingKind === 'arrow' ? '如：注意管线' : '如：窗洞净宽'}
                  autoFocus={pendingKind === 'arrow'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmPending()
                  }}
                />
              </label>
            )}
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={resetPending}>
                取消
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={
                  (pendingKind === 'dimension' || pendingKind === 'text') && !valueInput.trim()
                }
                onClick={confirmPending}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
