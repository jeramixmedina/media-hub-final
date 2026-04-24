import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import PlaybackToolbar from './components/PlaybackToolbar'
import Songbook from './screens/Songbook'
import NowPlaying from './screens/NowPlaying'
import QueueScreen from './screens/QueueScreen'
import FavoritesScreen from './screens/FavoritesScreen'
import Settings from './screens/Settings'
import RemoteScreen from './screens/RemoteScreen'
import { useApp } from './context/AppContext'

export default function App() {
  const { currentSong, queue } = useApp()
  const location = useLocation()
  const [navHidden, setNavHidden] = useState(false)
  const hideTimerRef = useRef(null)
  const isNowPlayingVideo = location.pathname === '/nowplaying' && !!currentSong

  const scheduleAutoHide = useCallback(() => {
    clearTimeout(hideTimerRef.current)
    if (!isNowPlayingVideo) return
    hideTimerRef.current = setTimeout(() => {
      setNavHidden(true)
    }, 1500)
  }, [isNowPlayingVideo])

  const showNavTemporarily = useCallback(() => {
    setNavHidden(false)
    scheduleAutoHide()
  }, [scheduleAutoHide])

  useEffect(() => {
    if (!isNowPlayingVideo) {
      clearTimeout(hideTimerRef.current)
      setNavHidden(false)
      return
    }
    showNavTemporarily()
  }, [isNowPlayingVideo, showNavTemporarily])

  useEffect(() => {
    if (!isNowPlayingVideo) return
    showNavTemporarily()
  }, [queue.length, isNowPlayingVideo, showNavTemporarily])

  useEffect(() => {
    if (!isNowPlayingVideo) return
    const onTouchAnywhere = () => showNavTemporarily()
    window.addEventListener('pointerdown', onTouchAnywhere, { passive: true })
    return () => window.removeEventListener('pointerdown', onTouchAnywhere)
  }, [isNowPlayingVideo, showNavTemporarily])

  useEffect(() => {
    return () => clearTimeout(hideTimerRef.current)
  }, [])

  return (
    <div className="flex flex-col h-full bg-bg text-white">
      <div className="flex-1 overflow-hidden relative">
        <Routes>
          <Route path="/"           element={<Navigate to="/songbook" replace />} />
          <Route path="/songbook"   element={<Songbook />} />
          <Route path="/search"     element={<Navigate to="/songbook" replace />} />
          <Route path="/nowplaying" element={<NowPlaying />} />
          <Route path="/queue"      element={<QueueScreen />} />
          <Route path="/favorites"  element={<FavoritesScreen />} />
          <Route path="/settings"   element={<Settings />} />
          <Route path="/remote"     element={<RemoteScreen />} />
        </Routes>
      </div>

      {/* Playback toolbar — numpad + QR, only shows when song is playing */}
      <PlaybackToolbar />

      {/* Main nav */}
      <BottomNav hasNowPlaying={!!currentSong} hidden={navHidden} />
    </div>
  )
}
