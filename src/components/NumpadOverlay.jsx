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
      style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.35)',
        display:'flex', alignItems:'flex-end', justifyContent:'flex-end', padding:'0 16px 76px' }}
      onPointerDown={onClose}
    >
      <div
        style={{ background:'#12121e', borderRadius:20, padding:12, width:220 }}
        onPointerDown={e => e.stopPropagation()}
      >
        {/* Display */}
        <div style={{ background:'#0a0a12', borderRadius:12, padding:'8px 10px',
          marginBottom:8, minHeight:56 }}>
          <div style={{ fontSize:26, fontWeight:700, color:'#a78bfa',
            fontFamily:'monospace', letterSpacing:6 }}>
            {input || '—'}
          </div>
          {matched && (
            <div style={{ marginTop:4 }}>
              <div style={{ color:'#f1f5f9', fontSize:12, fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                {matched.title}
              </div>
              <div style={{ color:'#475569', fontSize:11, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{matched.artist}</div>
            </div>
          )}
          {input && !matched && (
            <div style={{ color:'#475569', fontSize:11, marginTop:4 }}>
              No song with number {input}
            </div>
          )}
          {added && (
            <div style={{ color:'#22c55e', fontSize:11, marginTop:4, fontWeight:500 }}>
              Added to queue ✓
            </div>
          )}
        </div>

        {/* Number grid */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)',
          gap:6, marginBottom:8 }}>
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
                borderRadius: 10,
                padding: '12px 0',
                fontSize: k === '⌫' ? 18 : k === 'ADD' ? 12 : 20,
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
            border:'none', padding:'8px', fontSize:12 }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
