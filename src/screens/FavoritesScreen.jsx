import React, { useMemo, useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FixedSizeList as List } from 'react-window'
import { useApp } from '../context/AppContext'
import { sortLibrary } from '../lib/search'
import SongRow from '../components/SongRow'

const ROW_HEIGHT = 72

export default function FavoritesScreen() {
  const { library, favorites } = useApp()
  const navigate = useNavigate()
  const [containerHeight, setContainerHeight] = useState(500)

  const measuredRef = useCallback(node => {
    if (!node) return
    const ro = new ResizeObserver(([e]) => setContainerHeight(e.contentRect.height))
    ro.observe(node)
  }, [])

  const favSongs = useMemo(() => {
    const favSet = new Set(favorites)
    return sortLibrary(library.filter(s => favSet.has(s.id)))
  }, [library, favorites])

  const Row = useCallback(({ index, style }) => (
    <SongRow song={favSongs[index]} style={style} />
  ), [favSongs])

  return (
    <div className="flex flex-col h-full screen-enter">
      <div className="px-4 pt-4 pb-3 bg-surface border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-white font-bold text-xl flex-1">Favorites</h1>
          <span className="text-muted text-sm">{favSongs.length} songs</span>
        </div>
      </div>

      {favSongs.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 px-8 text-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-14 h-14 text-muted">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <p className="text-white font-semibold text-xl">No favorites yet</p>
          <p className="text-muted text-sm">Tap the star icon on any song to add it here.</p>
          <button
            className="mt-2 bg-accent text-white font-medium px-6 py-3 rounded-2xl touchable"
            onPointerDown={() => navigate('/songbook')}
          >
            Browse Songbook
          </button>
        </div>
      ) : (
        <div ref={measuredRef} className="flex-1 overflow-hidden">
          <List
            height={containerHeight}
            itemCount={favSongs.length}
            itemSize={ROW_HEIGHT}
            width="100%"
          >
            {Row}
          </List>
        </div>
      )}
    </div>
  )
}
