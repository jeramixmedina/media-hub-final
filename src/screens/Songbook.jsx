import React, { useState, useMemo, useCallback, useRef } from 'react'
import { FixedSizeList as List } from 'react-window'
import { useApp } from '../context/AppContext'
import { search, sortLibrary } from '../lib/search'
import SongRow from '../components/SongRow'

const ROW_HEIGHT = 72

export default function Songbook() {
  const { library, hasLibrary, isScanning, scanCount } = useApp()
  const [query, setQuery]       = useState('')
  const [filter, setFilter]     = useState('all') // all | numbered | unnumbered
  const containerRef            = useRef(null)
  const [containerHeight, setContainerHeight] = useState(500)

  // Measure available height for virtual list
  const measuredRef = useCallback(node => {
    if (!node) return
    const ro = new ResizeObserver(([e]) => setContainerHeight(e.contentRect.height))
    ro.observe(node)
  }, [])

  const results = useMemo(() => {
    let songs = query.trim() ? search(query, library) : sortLibrary(library)
    if (filter === 'numbered')   songs = songs.filter(s => s.number != null)
    if (filter === 'unnumbered') songs = songs.filter(s => s.number == null)
    return songs
  }, [query, library, filter])

  const Row = useCallback(({ index, style }) => (
    <SongRow song={results[index]} style={style} />
  ), [results])

  if (isScanning) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-white font-medium">Scanning library…</p>
        <p className="text-muted text-sm">{scanCount} songs found</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full screen-enter">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 bg-surface border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <h1 className="text-white font-bold text-xl flex-1">Songbook</h1>
          <span className="text-muted text-sm">{library.length.toLocaleString()} songs</span>
        </div>

        {/* Search bar */}
        <div className="relative mb-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by number, title or artist…"
            className="w-full bg-card text-white placeholder-muted text-sm rounded-xl pl-9 pr-4 py-3 outline-none focus:ring-1 focus:ring-accent"
          />
          {query && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted touchable"
              onPointerDown={() => setQuery('')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex gap-2">
          {[['all', 'All'], ['numbered', 'Numbered'], ['unnumbered', 'No number']].map(([val, label]) => (
            <button
              key={val}
              onPointerDown={() => setFilter(val)}
              className={`px-3 py-1.5 rounded-full text-sm touchable
                ${filter === val
                  ? 'bg-accent text-white'
                  : 'bg-card text-muted'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {!hasLibrary && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 px-8 text-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 text-muted">
            <path d="M9 18V5l12-2v13"/>
            <circle cx="6" cy="18" r="3"/>
            <circle cx="18" cy="16" r="3"/>
          </svg>
          <p className="text-white font-medium">No songs yet</p>
          <p className="text-muted text-sm">Go to Settings, add your video folder, then tap Scan Library.</p>
        </div>
      )}

      {/* Results count when searching */}
      {query.trim() && (
        <div className="px-4 py-2 text-muted text-xs shrink-0 bg-surface">
          {results.length} result{results.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Virtual list */}
      <div ref={measuredRef} className="flex-1 overflow-hidden">
        {results.length > 0 && (
          <List
            height={containerHeight}
            itemCount={results.length}
            itemSize={ROW_HEIGHT}
            width="100%"
          >
            {Row}
          </List>
        )}

        {hasLibrary && results.length === 0 && query && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <p className="text-white">No songs match "{query}"</p>
            <p className="text-muted text-sm">Try a different search term or number</p>
          </div>
        )}
      </div>
    </div>
  )
}
