import React, { useState } from 'react'
import { useApp } from '../context/AppContext'
import NumpadOverlay from './NumpadOverlay'
import QRMini from './QRMini'

export default function PlaybackToolbar({ hidden = false }) {
  const { currentSong, queue } = useApp()
  const [showNumpad, setShowNumpad] = useState(false)
  const [showQR, setShowQR]         = useState(false)

  // Only show toolbar when a song is playing
  if (!currentSong) return null

  return (
    <>
      {/* Toolbar strip above nav bar */}
      <div
        className={`transition-all duration-300 overflow-hidden shrink-0 ${hidden ? 'max-h-0 opacity-0 pointer-events-none border-t-0 py-0' : 'max-h-20 opacity-100'}`}
        style={{
          background: '#0d0d1a',
          borderTop: '1px solid rgba(124,58,237,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          padding: '5px 10px',
        }}
      >

        {/* Now playing + up next */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{
            fontSize: 11,
            fontWeight: 500,
            color: '#a78bfa',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            ▶ {currentSong.title}
            <span style={{ color: '#475569' }}>
              {' '}· Up next {queue.length}
            </span>
          </div>
        </div>

        {/* Remote tools in one compact group */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: '#131326',
          border: '1px solid rgba(124,58,237,0.22)',
          borderRadius: 999,
          padding: '2px',
          flexShrink: 0,
        }}>
          {/* Number pad button */}
          <button
            onPointerDown={() => setShowNumpad(true)}
            style={{
              background: '#1a1a2e',
              border: '1px solid rgba(124,58,237,0.28)',
              borderRadius: 999,
              color: '#a78bfa',
              width: 34,
              height: 34,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Quick song number"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.8" style={{ width:15, height:15 }}>
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
          </button>

          {/* QR button */}
          <button
            onPointerDown={() => setShowQR(true)}
            style={{
              background: '#1a1a2e',
              border: '1px solid rgba(124,58,237,0.28)',
              borderRadius: 999,
              color: '#a78bfa',
              width: 34,
              height: 34,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Remote QR"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.8" style={{ width:16, height:16 }}>
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <path d="M14 14h.01M14 17h.01M17 14h.01M17 17h.01M20 14h.01M20 17h.01M20 20h.01M17 20h.01M14 20h.01"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Overlays */}
      {showNumpad && <NumpadOverlay onClose={() => setShowNumpad(false)} />}
      {showQR     && <QRMini       onClose={() => setShowQR(false)} />}
    </>
  )
}
