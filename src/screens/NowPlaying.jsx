import React from 'react'
import { useNavigate } from 'react-router-dom'
import VideoPlayer from '../components/VideoPlayer'
import { useApp } from '../context/AppContext'

export default function NowPlaying() {
  const { currentSong, queue, songEnded, addNextInQueue } = useApp()
  const navigate = useNavigate()

  if (!currentSong) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center screen-enter">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-16 h-16 text-muted">
          <circle cx="12" cy="12" r="10"/>
          <polygon fill="currentColor" stroke="none" points="10 8 16 12 10 16 10 8"/>
        </svg>
        <p className="text-white font-semibold text-xl">Nothing playing</p>
        <p className="text-muted text-sm">Find a song in the Songbook or Search and tap the play button.</p>
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
    <div className="flex flex-col h-full bg-black screen-enter">
      {/* Video — takes most of the screen */}
      <div className="flex-1 overflow-hidden">
        <VideoPlayer />
      </div>

      {/* Up Next strip — shows next 3 in queue */}
      {queue.length > 0 && (
        <div className="bg-surface border-t border-white/5 shrink-0">
          <div className="px-4 py-2 flex items-center gap-2">
            <span className="text-muted text-xs font-medium uppercase tracking-wider">Up next</span>
            <span className="text-accent text-xs bg-accent/20 px-2 py-0.5 rounded-full">{queue.length}</span>
          </div>
          <div className="overflow-x-auto">
            <div className="flex gap-2 px-4 pb-3" style={{ width: 'max-content' }}>
              {queue.slice(0, 5).map((song, i) => (
                <div
                  key={`${song.id}-${i}`}
                  className="bg-card rounded-xl px-3 py-2 flex items-center gap-2 shrink-0"
                  style={{ maxWidth: 200 }}
                >
                  <span className="text-accent-light text-xs font-mono shrink-0">#{i + 1}</span>
                  <div className="min-w-0">
                    <p className="text-white text-xs font-medium truncate">{song.title}</p>
                    <p className="text-muted text-xs truncate">{song.artist}</p>
                  </div>
                </div>
              ))}
              {queue.length > 5 && (
                <button
                  className="bg-card rounded-xl px-3 py-2 flex items-center shrink-0 touchable"
                  onPointerDown={() => navigate('/queue')}
                >
                  <span className="text-muted text-xs">+{queue.length - 5} more</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
