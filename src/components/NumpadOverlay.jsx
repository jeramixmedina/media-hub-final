import React, { useState, useMemo } from 'react'
import { useApp } from '../context/AppContext'

export default function NumpadOverlay({ onClose }) {
  const { library, addToQueue } = useApp()
  const [input, setInput]       = useState('')
  const [added, setAdded]       = useState(false)

  const matched = useMemo(() => {
    if (!input) return null
    return library.find(s => String(s.number) === input) || null
  }, [input, library])

  function pressKey(k) {
    if (input.length < 5) setInput(p => p + k)
  }

  function handleAdd() {
    if (!matched) return
    addToQueue(matched)
    setAdded(true)
    setInput('')
    setTimeout(() => setAdded(false), 1500)
  }

  const keys = ['1','2','3','4','5','6','7','8','9','⌫','0','ADD']

  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.88)',
        display:'flex', flexDirection:'column', justifyContent:'flex-end' }}
      onPointerDown={onClose}
    >
      <div
        style={{ background:'#12121e', borderRadius:'20px 20px 0 0', padding:16 }}
        onPointerDown={e => e.stopPropagation()}
      >
        {/* Display */}
        <div style={{ background:'#0a0a12', borderRadius:14, padding:'12px 16px',
          marginBottom:12, minHeight:70 }}>
          <div style={{ fontSize:36, fontWeight:700, color:'#a78bfa',
            fontFamily:'monospace', letterSpacing:10 }}>
            {input || '—'}
          </div>
          {matched && (
            <div style={{ marginTop:4 }}>
              <div style={{ color:'#f1f5f9', fontSize:14, fontWeight:500 }}>
                {matched.title}
              </div>
              <div style={{ color:'#475569', fontSize:12 }}>{matched.artist}</div>
            </div>
          )}
          {input && !matched && (
            <div style={{ color:'#475569', fontSize:12, marginTop:4 }}>
              No song with number {input}
            </div>
          )}
          {added && (
            <div style={{ color:'#22c55e', fontSize:13, marginTop:4, fontWeight:500 }}>
              Added to queue ✓
            </div>
          )}
        </div>

        {/* Number grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)',
          gap:8, marginBottom:10 }}>
          {keys.map(k => (
            <button
              key={k}
              onPointerDown={() => {
                if (k === '⌫') setInput(p => p.slice(0, -1))
                else if (k === 'ADD') handleAdd()
                else pressKey(k)
              }}
              style={{
                background: k === 'ADD'
                  ? (matched ? '#7c3aed' : '#2a2a3e')
                  : k === '⌫' ? '#2a2a3e' : '#1a1a2e',
                color: k === 'ADD'
                  ? (matched ? '#fff' : '#475569')
                  : k === '⌫' ? '#f59e0b' : '#f1f5f9',
                border: 'none',
                borderRadius: 14,
                padding: '20px 0',
                fontSize: k === '⌫' ? 22 : k === 'ADD' ? 14 : 26,
                fontWeight: k === 'ADD' ? 700 : 500,
                cursor: 'pointer',
                transition: 'opacity .1s',
              }}
            >
              {k}
            </button>
          ))}
        </div>

        {/* Cancel */}
        <button
          onPointerDown={onClose}
          style={{ width:'100%', background:'transparent', color:'#475569',
            border:'none', padding:'12px', fontSize:14 }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}