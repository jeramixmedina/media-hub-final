import React from 'react'
import { useApp } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'

export default function SongRow({ song, showNumber = true, style }) {
  const { addToQueue, playNow, toggleFavorite, favorites, currentSong, queue } = useApp()
  const navigate = useNavigate()

  const isFav      = favorites.includes(song.id)
  const isPlaying  = currentSong?.id === song.id
  const isInQueue  = queue.some(s => s.id === song.id)

  function handlePlay() {
    playNow(song)
    navigate('/nowplaying')
  }

  function handleQueue() {
    addToQueue(song)
  }

  return (
    <div
      style={style}
      className={`flex items-center gap-3 px-4 border-b border-white/5 no-select
        ${isPlaying ? 'bg-accent-dim/40' : 'bg-transparent active:bg-card'}`}
    >
      {/* Song number */}
      {showNumber && (
        <span className="text-muted text-sm font-mono w-10 shrink-0 text-right">
          {song.number ?? '—'}
        </span>
      )}

      {/* Now playing indicator or play button */}
      <button
        className="shrink-0 w-10 h-10 flex items-center justify-center touchable"
        onPointerDown={handlePlay}
      >
        {isPlaying ? (
          <span className="flex gap-0.5 items-end h-4">
            <span className="w-0.5 bg-success rounded-full animate-bounce" style={{ height: '60%', animationDelay: '0ms' }} />
            <span className="w-0.5 bg-success rounded-full animate-bounce" style={{ height: '100%', animationDelay: '150ms' }} />
            <span className="w-0.5 bg-success rounded-full animate-bounce" style={{ height: '40%', animationDelay: '75ms' }} />
          </span>
        ) : (
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-muted" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
        )}
      </button>

      {/* Title + Artist */}
      <div className="flex-1 min-w-0 py-2">
        <p className={`font-medium truncate leading-tight ${isPlaying ? 'text-accent-light' : 'text-white'}`}>
          {song.title}
        </p>
        <p className="text-sm text-muted truncate mt-0.5">{song.artist}</p>
      </div>

      {/* In-queue indicator */}
      {isInQueue && !isPlaying && (
        <span className="text-xs text-accent-light bg-accent/20 px-2 py-1 rounded-full shrink-0">
          queued
        </span>
      )}

      {/* Favorite button */}
      <button
        className="shrink-0 w-10 h-10 flex items-center justify-center touchable"
        onPointerDown={() => toggleFavorite(song.id)}
      >
        <svg viewBox="0 0 24 24" className={`w-5 h-5 ${isFav ? 'text-pink fill-pink' : 'text-muted'}`}
          fill={isFav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      </button>

      {/* Add to queue button */}
      <button
        className="shrink-0 w-10 h-10 flex items-center justify-center touchable"
        onPointerDown={handleQueue}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
          className="w-5 h-5 text-accent-light">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    </div>
  )
}
