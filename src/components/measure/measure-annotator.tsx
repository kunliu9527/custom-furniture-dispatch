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

  const [annotations, setAnnotations] = useState<Annotation[]>(photo.annotations)
  const [history, setHistory] = useState<Annotation[][]>([])
  const [name, setName] = useState(photo.name)
  const [room, setRoom] = useState(photo.room)
  const [tool, setTool] = useState<ToolMode>('dimension')
  const [unit, setUnit] = useState<Unit>('mm')
  const [color, setColor] = useState(COLORS[0])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draftStart, setDraftStart] = useState<Point | null>(null)
  const [hover, setHover] = useState<Point | null>(null)
  const [pendingLine, setPendingLine] = useState<DraftLine>(null)
  const [pendingKind, setPendingKind] = useState<'dimension' | 'arrow' | 'text' | null>(null)
  const [valueInput, setValueInput] = useState('')
  const [noteInput, setNoteInput] = useState('')
  const [textPos, setTextPos] = useState<Point | null>(null)
  const [ready, setReady] = useState(false)
  const [naturalSize, setNaturalSize] = useState({ w: 1, h: 1 })
  const [dirty, setDirty] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)

  // 切换照片时重置编辑状态
  useEffect(() => {
    setAnnotations(photo.annotations)
    setHistory([])
    setName(photo.name)
    setRoom(photo.room)
    setSelectedId(null)
    setDraftStart(null)
    setHover(null)
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

  useEffect(() => {
    if (!ready) return
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    const img = imageRef.current
    if (!canvas || !wrap || !img) return

    const draw = () => {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const sx = canvas.width / img.naturalWidth
      const sy = canvas.height / img.naturalHeight

      for (const a of annotations) {
        drawAnnotation(ctx, a, sx, sy, a.id === selectedId)
      }

      if (draftStart && hover && (tool === 'dimension' || tool === 'arrow')) {
        ctx.save()
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.setLineDash([6, 4])
        ctx.beginPath()
        ctx.moveTo(draftStart.x * sx, draftStart.y * sy)
        ctx.lineTo(hover.x * sx, hover.y * sy)
        ctx.stroke()
        ctx.restore()
      }
    }

    const resize = () => {
      const maxW = wrap.clientWidth
      const maxH = Math.min(window.innerHeight * 0.56, 640)
      const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1)
      canvas.width = Math.floor(img.naturalWidth * scale)
      canvas.height = Math.floor(img.naturalHeight * scale)
      draw()
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [ready, annotations, selectedId, draftStart, hover, color, tool, naturalSize])

  function toImageCoords(clientX: number, clientY: number): Point | null {
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img) return null
    const rect = canvas.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * img.naturalWidth
    const y = ((clientY - rect.top) / rect.height) * img.naturalHeight
    return {
      x: Math.max(0, Math.min(img.naturalWidth, x)),
      y: Math.max(0, Math.min(img.naturalHeight, y)),
    }
  }

  function hitTest(x: number, y: number): string | null {
    const threshold = Math.max(naturalSize.w, naturalSize.h) * 0.018
    for (let i = annotations.length - 1; i >= 0; i--) {
      if (hitTestAnnotation(annotations[i], x, y, threshold)) return annotations[i].id
    }
    return null
  }

  function onPointerDown(e: ReactPointerEvent) {
    if (pendingKind) return
    const canvas = canvasRef.current
    if (!canvas) return
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

    // dimension / arrow
    const hit = hitTest(pt.x, pt.y)
    if (hit && !draftStart) {
      setSelectedId(hit)
      setTool('select')
      return
    }

    if (!draftStart) {
      setDraftStart(pt)
      setHover(pt)
      setSelectedId(null)
    } else {
      const line = { x1: draftStart.x, y1: draftStart.y, x2: pt.x, y2: pt.y }
      setPendingLine(line)
      setPendingKind(tool === 'arrow' ? 'arrow' : 'dimension')
      setValueInput('')
      setNoteInput('')
      setDraftStart(null)
      setHover(null)
    }
  }

  function onPointerMove(e: ReactPointerEvent) {
    const pt = toImageCoords(e.clientX, e.clientY)
    if (!pt) return

    if (tool === 'pen' && drawingPen.current && selectedId) {
      setAnnotations((prev) =>
        prev.map((a) => {
          if (a.id !== selectedId || a.kind !== 'pen') return a
          return { ...a, points: [...a.points, pt] }
        }),
      )
      setDirty(true)
      return
    }

    if (draftStart && (tool === 'dimension' || tool === 'arrow')) {
      setHover(pt)
    }
  }

  function onPointerUp() {
    if (drawingPen.current) {
      drawingPen.current = false
      // finalize history already pushed at start; mark dirty
      setDirty(true)
    }
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
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1200)
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
          ? '再点一下确定终点'
          : '点两点画尺寸线'
        : tool === 'arrow'
          ? draftStart
            ? '再点一下确定箭头终点'
            : '点两点画指示箭头'
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
            >
              ‹ 上一张
            </button>
            <span className="pager-index">
              {photoIndex + 1} / {photoCount}
            </span>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={!canNext}
              onClick={() => handleNavigate(1)}
            >
              下一张 ›
            </button>
          </div>
        ) : null}
        <div className="topbar-actions">
          <button type="button" className="btn btn-ghost" disabled={!history.length} onClick={undo}>
            撤销
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}>
            {savedFlash ? '已保存' : dirty ? '保存*' : '保存'}
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
                setHover(null)
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
            onPointerUp()
            if (!start || tool !== 'select' || !showPager || pendingKind) return
            const dx = e.clientX - start.x
            const dy = e.clientY - start.y
            if (Math.abs(dx) < 72 || Math.abs(dx) < Math.abs(dy) * 1.4) return
            if (dx < 0 && canNext) handleNavigate(1)
            if (dx > 0 && canPrev) handleNavigate(-1)
          }}
          onPointerCancel={onPointerUp}
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
