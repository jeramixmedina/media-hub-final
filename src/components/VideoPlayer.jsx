import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { useApp } from '../context/AppContext'

// Convert a relative ExternalStorage path to a playable URL
async function resolveVideoUrl(filePath) {
  try {
    const { uri } = await Filesystem.getUri({
      path: filePath,
      directory: Directory.ExternalStorage,
    })
    return Capacitor.convertFileSrc(uri)
  } catch (err) {
    console.error('Cannot resolve video URI:', filePath, err)
    return null
  }
}

const AUDIO_EXT = ['.mp3', '.flac', '.aac', '.wav', '.ogg', '.m4a']
function isAudioFile(path) {
  if (!path) return false
  const lower = path.toLowerCase()
  return AUDIO_EXT.some(e => lower.endsWith(e))
}

export default function VideoPlayer({ compact = false }) {
  const { currentSong, isPlaying, setPlaying, songEnded, queue } = useApp()
  const videoRef = useRef(null)
  const [videoSrc, setVideoSrc]   = useState(null)
  const [showControls, setShowControls] = useState(true)
  const [progress, setProgress]   = useState(0)
  const [duration, setDuration]   = useState(0)
  const controlsTimer             = useRef(null)
  const isAudio                   = isAudioFile(currentSong?.filePath)

  // Load video when song changes
  useEffect(() => {
    if (!currentSong) { setVideoSrc(null); return }
    resolveVideoUrl(currentSong.filePath).then(url => {
      setVideoSrc(url)
      setProgress(0)
    })
  }, [currentSong?.id])

  // Sync play/pause state
  useEffect(() => {
    const v = videoRef.current
    if (!v || !videoSrc) return
    if (isPlaying) {
      v.play().catch(() => setPlaying(false))
    } else {
      v.pause()
    }
  }, [isPlaying, videoSrc])

  const handleEnded = useCallback(() => {
    songEnded()
  }, [songEnded])

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current
    if (!v || !v.duration) return
    setProgress(v.currentTime / v.duration)
  }, [])

  const handleLoadedMetadata = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    setDuration(v.duration)
    if (isPlaying) v.play().catch(() => {})
  }, [isPlaying])

  // Tap to show/hide controls (auto-hide after 3s)
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true)
    clearTimeout(controlsTimer.current)
    controlsTimer.current = setTimeout(() => setShowControls(false), 3000)
  }, [])

  useEffect(() => {
    showControlsTemporarily()
    return () => clearTimeout(controlsTimer.current)
  }, [currentSong?.id])

  function togglePlay() {
    setPlaying(!isPlaying)
    showControlsTemporarily()
  }

  function handleSeek(e) {
    const v = videoRef.current
    if (!v) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    v.currentTime = ratio * v.duration
    showControlsTemporarily()
  }

  function formatTime(secs) {
    if (!secs || isNaN(secs)) return '0:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (!currentSong) return null

  return (
    <div
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden"
      onPointerDown={showControlsTemporarily}
    >
      {/* Media element — video or audio */}
      {videoSrc && !isAudio && (
        <video
          ref={videoRef}
          src={videoSrc}
          onEnded={handleEnded}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          playsInline
          preload="metadata"
          className="w-full h-full object-contain"
        />
      )}
      {videoSrc && isAudio && (
        <audio
          ref={videoRef}
          src={videoSrc}
          onEnded={handleEnded}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          preload="metadata"
        />
      )}

      {/* Audio-only visual */}
      {isAudio && (
        <div className="flex flex-col items-center justify-center flex-1 gap-6 px-8 w-full">
          <div className="w-36 h-36 rounded-full bg-accent/20 border-2 border-accent/40 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" className="w-16 h-16">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-2xl">{currentSong.title}</p>
            <p className="text-muted text-base mt-1">{currentSong.artist}</p>
          </div>
          {isPlaying && (
            <div className="flex gap-1.5 items-end h-8">
              {[60,100,40,80,50,70,90].map((h, i) => (
                <span key={i} className="w-1.5 bg-accent rounded-full animate-bounce"
                  style={{ height: `${h}%`, animationDelay: `${i * 80}ms` }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading state */}
      {!videoSrc && (
        <div className="flex flex-col items-center gap-3 text-muted">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      )}

      {/* Controls overlay */}
      {showControls && (
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none"
          style={{ background: isAudio ? 'none' : 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.7) 100%)' }}>

          {/* Top: song info (video only — audio shows it in the center UI) */}
          {!isAudio && (
            <div className="px-5 pt-4">
              <p className="text-white font-semibold text-lg leading-tight drop-shadow">{currentSong.title}</p>
              <p className="text-white/70 text-sm drop-shadow">{currentSong.artist}</p>
            </div>
          )}
          {isAudio && <div />}

          {/* Bottom: controls */}
          <div className="px-5 pb-4 pointer-events-auto">
            {/* Progress bar — display only */}
            <div className="h-1 bg-white/20 rounded-full mb-3">
              <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-xs font-mono">
                {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
              </span>

              {/* Pause / Play */}
              <button
                className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center touchable"
                onPointerDown={togglePlay}
              >
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1"/>
                    <rect x="14" y="4" width="4" height="16" rx="1"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                  </svg>
                )}
              </button>

              {/* Feature 2: Next button — skips to next in queue */}
              <button
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl touchable
                  ${queue.length > 0 ? 'bg-white/10 text-white' : 'bg-white/5 text-white/30'}`}
                onPointerDown={() => queue.length > 0 && songEnded()}
                disabled={queue.length === 0}
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <polygon points="5 4 15 12 5 20 5 4"/>
                  <line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
                </svg>
                <span className="text-xs">{queue.length > 0 ? `Next (${queue.length})` : 'Next'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
