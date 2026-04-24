import React from 'react'
import { useNavigate } from 'react-router-dom'
import VideoPlayer from '../components/VideoPlayer'
import { useApp } from '../context/AppContext'

export default function NowPlaying() {
  const { currentSong, songEnded } = useApp()
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
    </div>
  )
}
