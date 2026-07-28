import type { MeasureAnnotation as Annotation, DimensionAnnotation } from "./types";

export function distToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1
  const dy = y2 - y1
  if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1)
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy))
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

export function drawHandle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  size = 5,
) {
  ctx.fillStyle = '#fff'
  ctx.strokeStyle = color
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(x, y, size, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
}

function drawLabelBubble(
  ctx: CanvasRenderingContext2D,
  label: string,
  mx: number,
  my: number,
  color: string,
  selected: boolean,
  fontSize: number,
) {
  // 无底色填充，用描边保证在复杂背景上可读，不挡图
  ctx.font = `700 ${fontSize}px "PingFang SC", "Segoe UI", sans-serif`
  const metrics = ctx.measureText(label)
  const tw = metrics.width
  const bx = mx - tw / 2
  const by = my - fontSize - 6
  const textY = by + fontSize / 2

  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.miterLimit = 2
  ctx.lineWidth = selected ? Math.max(4, fontSize * 0.28) : Math.max(3, fontSize * 0.22)
  ctx.strokeStyle = selected ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.92)'
  ctx.strokeText(label, bx, textY)
  ctx.fillStyle = selected ? '#ffe566' : color
  ctx.fillText(label, bx, textY)
}

export function drawDimension(
  ctx: CanvasRenderingContext2D,
  a: DimensionAnnotation,
  sx: number,
  sy: number,
  selected: boolean,
  exportMode = false,
) {
  const x1 = a.x1 * sx
  const y1 = a.y1 * sy
  const x2 = a.x2 * sx
  const y2 = a.y2 * sy
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2

  ctx.save()
  ctx.strokeStyle = a.color
  ctx.fillStyle = a.color
  ctx.lineWidth = selected ? 3.5 : exportMode ? Math.max(2, 2.5 * Math.max(sx, sy)) : 2.5
  ctx.lineCap = 'round'

  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.lineTo(x2, y2)
  ctx.stroke()

  const angle = Math.atan2(y2 - y1, x2 - x1)
  const tick = exportMode ? 10 * Math.max(sx, sy, 1) : 8
  for (const [x, y] of [
    [x1, y1],
    [x2, y2],
  ] as const) {
    ctx.beginPath()
    ctx.moveTo(x + Math.cos(angle + Math.PI / 2) * tick, y + Math.sin(angle + Math.PI / 2) * tick)
    ctx.lineTo(x + Math.cos(angle - Math.PI / 2) * tick, y + Math.sin(angle - Math.PI / 2) * tick)
    ctx.stroke()
  }

  drawHandle(ctx, x1, y1, a.color, exportMode ? 6 * Math.max(sx, 1) : 5)
  drawHandle(ctx, x2, y2, a.color, exportMode ? 6 * Math.max(sx, 1) : 5)

  const label = `${a.value}${a.unit}${a.note ? ` ${a.note}` : ''}`
  const fontSize = exportMode ? Math.max(18, Math.round(22 * Math.max(sx, sy))) : 14
  drawLabelBubble(ctx, label, mx, my, a.color, selected, fontSize)
  ctx.restore()
}

export function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  selected: boolean,
  note: string | undefined,
  sx: number,
  sy: number,
  exportMode = false,
) {
  const ax1 = x1 * sx
  const ay1 = y1 * sy
  const ax2 = x2 * sx
  const ay2 = y2 * sy
  const angle = Math.atan2(ay2 - ay1, ax2 - ax1)
  const head = exportMode ? 14 * Math.max(sx, sy, 1) : 12

  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = selected ? 3.5 : exportMode ? Math.max(2, 2.5 * Math.max(sx, sy)) : 2.5
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(ax1, ay1)
  ctx.lineTo(ax2, ay2)
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(ax2, ay2)
  ctx.lineTo(ax2 - head * Math.cos(angle - 0.4), ay2 - head * Math.sin(angle - 0.4))
  ctx.lineTo(ax2 - head * Math.cos(angle + 0.4), ay2 - head * Math.sin(angle + 0.4))
  ctx.closePath()
  ctx.fill()

  if (note) {
    const fontSize = exportMode ? Math.max(16, Math.round(20 * Math.max(sx, sy))) : 13
    drawLabelBubble(ctx, note, (ax1 + ax2) / 2, (ay1 + ay2) / 2, color, selected, fontSize)
  }
  ctx.restore()
}

export function drawTextAnno(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color: string,
  selected: boolean,
  sx: number,
  sy: number,
  exportMode = false,
) {
  const px = x * sx
  const py = y * sy
  const fontSize = exportMode ? Math.max(18, Math.round(22 * Math.max(sx, sy))) : 15
  ctx.save()
  ctx.font = `700 ${fontSize}px "PingFang SC", "Segoe UI", sans-serif`
  ctx.textBaseline = 'bottom'
  ctx.lineJoin = 'round'
  ctx.miterLimit = 2
  ctx.lineWidth = selected ? Math.max(4, fontSize * 0.28) : Math.max(3, fontSize * 0.22)
  ctx.strokeStyle = selected ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.92)'
  ctx.strokeText(text, px, py)
  ctx.fillStyle = selected ? '#ffe566' : color
  ctx.fillText(text, px, py)
  if (selected) {
    const tw = ctx.measureText(text).width
    ctx.strokeStyle = color
    ctx.lineWidth = 1.5
    ctx.setLineDash([4, 3])
    ctx.strokeRect(px - 2, py - fontSize - 2, tw + 4, fontSize + 4)
    ctx.setLineDash([])
  }
  ctx.restore()
}

export function drawPen(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  color: string,
  width: number,
  selected: boolean,
  sx: number,
  sy: number,
  exportMode = false,
) {
  if (points.length < 2) return
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = (selected ? width * 1.4 : width) * (exportMode ? Math.max(sx, sy) : 1)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(points[0].x * sx, points[0].y * sy)
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x * sx, points[i].y * sy)
  }
  ctx.stroke()
  ctx.restore()
}

export function drawAnnotation(
  ctx: CanvasRenderingContext2D,
  a: Annotation,
  sx: number,
  sy: number,
  selected: boolean,
  exportMode = false,
) {
  switch (a.kind) {
    case 'dimension':
      drawDimension(ctx, a, sx, sy, selected, exportMode)
      break
    case 'arrow':
      drawArrow(ctx, a.x1, a.y1, a.x2, a.y2, a.color, selected, a.note, sx, sy, exportMode)
      break
    case 'text':
      drawTextAnno(ctx, a.x, a.y, a.text, a.color, selected, sx, sy, exportMode)
      break
    case 'pen':
      drawPen(ctx, a.points, a.color, a.width, selected, sx, sy, exportMode)
      break
  }
}

export function hitTestAnnotation(
  a: Annotation,
  x: number,
  y: number,
  threshold: number,
): boolean {
  switch (a.kind) {
    case 'dimension':
    case 'arrow':
      return distToSegment(x, y, a.x1, a.y1, a.x2, a.y2) < threshold
    case 'text': {
      // approximate hit box
      const w = Math.max(80, a.text.length * 14)
      const h = 28
      return x >= a.x && x <= a.x + w && y >= a.y - h && y <= a.y
    }
    case 'pen': {
      for (let i = 1; i < a.points.length; i++) {
        const p0 = a.points[i - 1]
        const p1 = a.points[i]
        if (distToSegment(x, y, p0.x, p0.y, p1.x, p1.y) < threshold * 1.2) return true
      }
      return false
    }
  }
}

export async function renderAnnotatedImage(
  imageDataUrl: string,
  annotations: Annotation[],
): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error('load fail'))
    el.src = imageDataUrl
  })
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return imageDataUrl
  ctx.drawImage(img, 0, 0)
  for (const a of annotations) {
    drawAnnotation(ctx, a, 1, 1, false, true)
  }
  return canvas.toDataURL('image/jpeg', 0.92)
}
