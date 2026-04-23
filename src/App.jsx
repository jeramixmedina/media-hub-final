import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import PlaybackToolbar from './components/PlaybackToolbar'
import Songbook from './screens/Songbook'
import SearchScreen from './screens/SearchScreen'
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
  const isNowPlayingActive = location.pathname === '/nowplaying' && !!currentSong

  const clearHideTimer = useCallback(() => {
    clearTimeout(hideTimerRef.current)
  }, [])

  const scheduleAutoHide = useCallback(() => {
    clearHideTimer()
    if (!isNowPlayingActive) return
    hideTimerRef.current = setTimeout(() => {
      setNavHidden(true)
    }, 1500)
  }, [clearHideTimer, isNowPlayingActive])

  const showNavTemporarily = useCallback(() => {
    setNavHidden(false)
    scheduleAutoHide()
  }, [scheduleAutoHide])

  useEffect(() => {
    if (!isNowPlayingActive) {
      clearHideTimer()
      setNavHidden(false)
      return
    }
    showNavTemporarily()
  }, [clearHideTimer, isNowPlayingActive, showNavTemporarily])

  useEffect(() => {
    if (!isNowPlayingActive) return
    showNavTemporarily()
  }, [queue.length, isNowPlayingActive, showNavTemporarily])

  useEffect(() => {
    if (!isNowPlayingActive) return
    const onTouchAnywhere = () => showNavTemporarily()
    window.addEventListener('pointerdown', onTouchAnywhere, { passive: true })
    return () => window.removeEventListener('pointerdown', onTouchAnywhere)
  }, [isNowPlayingActive, showNavTemporarily])

  useEffect(() => {
    return () => clearHideTimer()
  }, [clearHideTimer])

  return (
    <div className="flex flex-col h-full bg-bg text-white">
      <div className="flex-1 overflow-hidden relative">
        <Routes>
          <Route path="/"           element={<Navigate to="/songbook" replace />} />
          <Route path="/songbook"   element={<Songbook />} />
          <Route path="/search"     element={<SearchScreen />} />
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
