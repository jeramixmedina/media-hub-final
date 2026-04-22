import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function QueueScreen() {
  const {
    queue, currentSong, removeFromQueue,
    reorderQueue, clearQueue, playNow,
  } = useApp()
  const navigate = useNavigate()
  const [dragging, setDragging] = useState(null)   // index being dragged
  const [dragOver, setDragOver] = useState(null)   // index being hovered

  // ── Drag handlers (HTML5 drag API — works in WebView) ─────────────────────

  function onDragStart(e, index) {
    setDragging(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragEnter(index) {
    if (dragging === null || index === dragging) return
    setDragOver(index)
  }

  function onDragEnd() {
    if (dragging !== null && dragOver !== null && dragging !== dragOver) {
      const newQueue = [...queue]
      const [moved] = newQueue.splice(dragging, 1)
      newQueue.splice(dragOver, 0, moved)
      reorderQueue(newQueue)
    }
    setDragging(null)
    setDragOver(null)
  }

  if (!currentSong && queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center screen-enter">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-14 h-14 text-muted">
          <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
          <line x1="8" y1="18" x2="21" y2="18"/>
          <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
          <line x1="3" y1="18" x2="3.01" y2="18"/>
        </svg>
        <p className="text-white font-semibold text-xl">Queue is empty</p>
        <p className="text-muted text-sm">Add songs from the Songbook or Search using the + button.</p>
        <button
          className="mt-2 bg-accent text-white font-medium px-6 py-3 rounded-2xl touchable"
          onPointerDown={() => navigate('/songbook')}
        >
          Browse Songbook
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full screen-enter">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 bg-surface border-b border-white/5 shrink-0 flex items-center gap-3">
        <div className="flex-1">
          <h1 className="text-white font-bold text-xl">Queue</h1>
          <p className="text-muted text-sm">{queue.length} song{queue.length !== 1 ? 's' : ''} waiting</p>
        </div>
        {queue.length > 0 && (
          <button
            className="text-warning text-sm touchable px-3 py-2"
            onPointerDown={clearQueue}
          >
            Clear all
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Now playing card */}
        {currentSong && (
          <div className="mx-4 mt-4 mb-2">
            <p className="text-muted text-xs font-medium uppercase tracking-wider mb-2">Now playing</p>
            <div
              className="bg-accent-dim/50 border border-accent/30 rounded-2xl px-4 py-3 flex items-center gap-3 touchable"
              onPointerDown={() => navigate('/nowplaying')}
            >
              {/* Equalizer bars */}
              <span className="flex gap-0.5 items-end h-5 shrink-0">
                <span className="w-1 bg-success rounded-full animate-bounce" style={{ height: '60%', animationDelay: '0ms' }} />
                <span className="w-1 bg-success rounded-full animate-bounce" style={{ height: '100%', animationDelay: '150ms' }} />
                <span className="w-1 bg-success rounded-full animate-bounce" style={{ height: '40%', animationDelay: '75ms' }} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{currentSong.title}</p>
                <p className="text-muted text-sm truncate">{currentSong.artist}</p>
              </div>
              {currentSong.number && (
                <span className="text-accent-light text-sm font-mono shrink-0">#{currentSong.number}</span>
              )}
            </div>
          </div>
        )}

        {/* Queue list */}
        {queue.length > 0 && (
          <div className="px-4 mt-2 pb-4">
            <p className="text-muted text-xs font-medium uppercase tracking-wider mb-2">Up next</p>
            <p className="text-muted text-xs mb-3">Hold and drag to reorder</p>

            {queue.map((song, index) => (
              <div
                key={`${song.id}-${index}`}
                draggable
                onDragStart={e => onDragStart(e, index)}
                onDragEnter={() => onDragEnter(index)}
                onDragEnd={onDragEnd}
                onDragOver={e => e.preventDefault()}
                className={`flex items-center gap-3 bg-card rounded-xl px-3 py-3 mb-2 transition-all
                  ${dragging === index ? 'opacity-40' : ''}
                  ${dragOver === index ? 'border border-accent' : 'border border-transparent'}`}
              >
                {/* Drag handle */}
                <span className="text-muted shrink-0 cursor-grab active:cursor-grabbing">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                    <line x1="8" y1="9" x2="16" y2="9"/>
                    <line x1="8" y1="15" x2="16" y2="15"/>
                  </svg>
                </span>

                {/* Position number */}
                <span className="text-muted text-sm font-mono w-5 shrink-0 text-center">{index + 1}</span>

                {/* Song info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{song.title}</p>
                  <p className="text-muted text-xs truncate">{song.artist}</p>
                </div>

                {/* Song number badge */}
                {song.number && (
                  <span className="text-accent-light text-xs font-mono shrink-0">#{song.number}</span>
                )}

                {/* Play now */}
                <button
                  className="shrink-0 w-8 h-8 flex items-center justify-center touchable text-muted"
                  onPointerDown={() => { playNow(song); navigate('/nowplaying') }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                </button>

                {/* Remove */}
                <button
                  className="shrink-0 w-8 h-8 flex items-center justify-center touchable text-muted"
                  onPointerDown={() => removeFromQueue(index)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
