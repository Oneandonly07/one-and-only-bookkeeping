// app/components/Sparkline.tsx
'use client'

/**
 * Lightweight sparkline using plain SVG (no extra libraries).
 * Accepts an array of numbers; draws a line + area fill.
 */
export default function Sparkline({
  values,
  width = 420,
  height = 90,
  stroke = '#111827',      // gray-900
  fill = 'rgba(17,24,39,0.08)', // gray-900 with low alpha
}: {
  values: number[]
  width?: number
  height?: number
  stroke?: string
  fill?: string
}) {
  const pad = 6
  const w = width - pad * 2
  const h = height - pad * 2

  if (!values.length) {
    return <div className="text-xs text-gray-500">No data</div>
  }

  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1

  const stepX = values.length > 1 ? w / (values.length - 1) : 0

  const points = values.map((v, i) => {
    const x = pad + i * stepX
    const y = pad + (1 - (v - min) / span) * h
    return [x, y]
  })

  const d = points.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ')
  const area = `${d} L ${pad + (values.length - 1) * stepX} ${pad + h} L ${pad} ${pad + h} Z`

  return (
    <svg width={width} height={height} role="img" aria-label="sparkline">
      <path d={area} fill={fill} />
      <path d={d} fill="none" stroke={stroke} strokeWidth={2} />
    </svg>
  )
}
