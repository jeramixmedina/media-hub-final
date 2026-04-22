import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { FixedSizeList as List } from 'react-window'
import { useApp } from '../context/AppContext'
import { search } from '../lib/search'
import SongRow from '../components/SongRow'

const ROW_HEIGHT = 72

export default function SearchScreen() {
  const { library } = useApp()
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const [containerHeight, setContainerHeight] = useState(500)

  useEffect(() => { inputRef.current?.focus() }, [])

  const measuredRef = useCallback(node => {
    if (!node) return
    const ro = new ResizeObserver(([e]) => setContainerHeight(e.contentRect.height))
    ro.observe(node)
  }, [])

  const results = useMemo(() => {
    return query.trim() ? search(query, library) : []
  }, [query, library])

  const isNumberQuery = /^\d+$/.test(query.trim())

  const Row = useCallback(({ index, style }) => (
    <SongRow song={results[index]} style={style} />
  ), [results])

  return (
    <div className="flex flex-col h-full screen-enter">
      {/* Search input */}
      <div className="px-4 pt-4 pb-3 bg-surface border-b border-white/5 shrink-0">
        <h1 className="text-white font-bold text-xl mb-3">Search</h1>
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type a number, song title, or artist…"
            className="w-full bg-card text-white placeholder-muted rounded-xl pl-10 pr-10 py-4 text-base outline-none focus:ring-1 focus:ring-accent"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          {query && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted touchable"
              onPointerDown={() => { setQuery(''); inputRef.current?.focus() }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* Number lookup tip */}
        {isNumberQuery && (
          <p className="text-accent-light text-xs mt-2 px-1">
            ⚡ Searching by song number
          </p>
        )}

        {/* Results count */}
        {query.trim() && (
          <p className="text-muted text-xs mt-2 px-1">
            {results.length} result{results.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Empty / prompt state */}
      {!query.trim() && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 px-8 text-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-14 h-14 text-muted">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <p className="text-white font-medium text-lg">Find a song</p>
          <p className="text-muted text-sm">Type a song number for instant lookup, or search by title or artist name.</p>
        </div>
      )}

      {/* No results */}
      {query.trim() && results.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 gap-2">
          <p className="text-white">No results for "{query}"</p>
          <p className="text-muted text-sm">Try checking the spelling or a different keyword</p>
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
      </div>
    </div>
  )
}
