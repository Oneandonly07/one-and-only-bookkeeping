// app/(app)/reports/monthly/PrintButton.tsx
'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print inline-flex items-center rounded-md border px-3 h-9 hover:bg-gray-50"
      aria-label="Print"
      title="Print / Save as PDF"
    >
      Print
    </button>
  )
}
