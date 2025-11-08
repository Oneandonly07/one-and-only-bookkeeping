'use client'

/**
 * Simple, dependency-free cash-flow area chart.
 * Pass an ordered series of { dateLabel, value } where value is NET for the day.
 * The component renders cumulative net over the range to show trend.
 */
export default function CashFlowChart({
  points,
  height = 180,
  stroke = '#111827',                 // gray-900
  fill = 'rgba(17,24,39,0.08)',       // subtle area
}: {
  points: { dateLabel: string; value: number }[]
  height?: number
  stroke?: string
  fill?: string
}) {
  const padX = 12
  const padY = 10
  const width = Math.max(560, points.length * 16) // adaptive width

  if (!points.length) {
    return <div className="text-sm text-gray-500">No data in range</div>
  }

  // Build cumulative series so ups/downs are readable
  const cum: number[] = []
  let run = 0
  for (const p of points) {
    run += p.value
    cum.push(run)
  }

  const min = Math.min(...cum)
  const max = Math.max(...cum)
  const span = max - min || 1

  const innerW = width - padX * 2
  const innerH = height - padY * 2
  const stepX = points.length > 1 ? innerW / (points.length - 1) : 0

  const toXY = (i: number) => {
    const x = padX + i * stepX
    const y = padY + (1 - (cum[i] - min) / span) * innerH
    return [x, y]
  }

  const path = cum.map((_, i) => {
    const [x, y] = toXY(i)
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

  const lastX = padX + (points.length - 1) * stepX
  const area = `${path} L ${lastX} ${padY + innerH} L ${padX} ${padY + innerH} Z`

  return (
    <div className="overflow-x-auto">
      <svg width={width} height={height} role="img" aria-label="Cash flow">
        <path d={area} fill={fill} />
        <path d={path} fill="none" stroke={stroke} strokeWidth={2} />
        {/* zero line if range crosses 0 */}
        {min < 0 && max > 0 && (
          <line
            x1={padX} x2={padX + innerW}
            y1={padY + (1 - (0 - min) / span) * innerH}
            y2={padY + (1 - (0 - min) / span) * innerH}
            stroke="rgba(0,0,0,0.2)" strokeDasharray="4 4"
          />
        )}
      </svg>
    </div>
  )
}
