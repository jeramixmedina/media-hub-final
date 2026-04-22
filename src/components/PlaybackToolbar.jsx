import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import NumpadOverlay from './NumpadOverlay'
import QRMini from './QRMini'

export default function PlaybackToolbar() {
  const { currentSong } = useApp()
  const [showNumpad, setShowNumpad] = useState(false)
  const [showQR, setShowQR]         = useState(false)

  // Only show toolbar when a song is playing
  if (!currentSong) return null

  return (
    <>
      {/* Toolbar strip above nav bar */}
      <div style={{
        background: '#0d0d1a',
        borderTop: '1px solid rgba(124,58,237,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 16px',
        flexShrink: 0,
      }}>

        {/* Now playing marquee */}
        <div style={{ flex:1, minWidth:0, marginRight:12 }}>
          <div style={{
            fontSize: 12,
            fontWeight: 500,
            color: '#a78bfa',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            ▶ {currentSong.title}
          </div>
          <div style={{ fontSize:11, color:'#475569', marginTop:1 }}>
            {currentSong.artist}
          </div>
        </div>

        {/* Number pad button */}
        <button
          onPointerDown={() => setShowNumpad(true)}
          style={{
            background: '#1a1a2e',
            border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: 10,
            color: '#a78bfa',
            fontSize: 13,
            fontWeight: 700,
            padding: '8px 16px',
            marginRight: 8,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexShrink: 0,
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" style={{ width:14, height:14 }}>
            <rect x="3" y="3" width="4" height="4" rx="1"/>
            <rect x="10" y="3" width="4" height="4" rx="1"/>
            <rect x="17" y="3" width="4" height="4" rx="1"/>
            <rect x="3" y="10" width="4" height="4" rx="1"/>
            <rect x="10" y="10" width="4" height="4" rx="1"/>
            <rect x="17" y="10" width="4" height="4" rx="1"/>
            <rect x="3" y="17" width="4" height="4" rx="1"/>
            <rect x="10" y="17" width="4" height="4" rx="1"/>
            <rect x="17" y="17" width="4" height="4" rx="1"/>
          </svg>
          # Song
        </button>

        {/* QR button */}
        <button
          onPointerDown={() => setShowQR(true)}
          style={{
            background: '#1a1a2e',
            border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: 10,
            color: '#a78bfa',
            padding: '8px 10px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.8" style={{ width:18, height:18 }}>
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <path d="M14 14h.01M14 17h.01M17 14h.01M17 17h.01M20 14h.01M20 17h.01M20 20h.01M17 20h.01M14 20h.01"/>
          </svg>
        </button>
      </div>

      {/* Overlays */}
      {showNumpad && <NumpadOverlay onClose={() => setShowNumpad(false)} />}
      {showQR     && <QRMini       onClose={() => setShowQR(false)} />}
    </>
  )
}