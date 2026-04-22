import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import Songbook from './screens/Songbook'
import SearchScreen from './screens/SearchScreen'
import NowPlaying from './screens/NowPlaying'
import QueueScreen from './screens/QueueScreen'
import FavoritesScreen from './screens/FavoritesScreen'
import Settings from './screens/Settings'
import RemoteScreen from './screens/RemoteScreen'
import { useApp } from './context/AppContext'

export default function App() {
  const { currentSong } = useApp()

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
      <BottomNav hasNowPlaying={!!currentSong} />
    </div>
  )
}