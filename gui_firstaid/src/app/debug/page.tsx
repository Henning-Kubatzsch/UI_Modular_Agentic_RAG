// app/debug/page.tsx
'use client'

import { useEffect, useState } from 'react'

export default function DebugPage() {
  const [info, setInfo] = useState<any>(null)

  useEffect(() => {
    setInfo({
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      colorScheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
      touchSupport: 'ontouchstart' in window,
      colorMixSupport: CSS.supports('background', 'color-mix(in oklab, white, black)'),
    })
  }, [])

  if (!info) return <div>Loading...</div>

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', fontSize: '12px' }}>
      <h1>iOS Debug Info</h1>
      <pre>{JSON.stringify(info, null, 2)}</pre>
    </div>
  )
}
