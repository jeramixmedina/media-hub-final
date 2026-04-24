import React, { useEffect, useMemo, useState } from 'react'

export default function FilterPanel({ indexPath = '/index.json', onExport }) {
  const [index, setIndex] = useState([])
  const [filters, setFilters] = useState({
    subtype: [],
    filetype: [],
    artist: '',
    genre: '',
    q: '',
  })

  useEffect(() => {
    fetch(indexPath)
      .then(response => response.json())
      .then(data => setIndex(Array.isArray(data) ? data : []))
      .catch(() => setIndex([]))
  }, [indexPath])

  const options = useMemo(() => ({
    subtype: [...new Set(index.map(item => item.subtype).filter(Boolean))],
    filetype: [...new Set(index.map(item => item.filetype).filter(Boolean))],
  }), [index])

  const results = useMemo(() => {
    return index.filter(item => {
      if (filters.subtype.length && !filters.subtype.includes(item.subtype)) return false
      if (filters.filetype.length && !filters.filetype.includes(item.filetype)) return false
      if (filters.artist && !(item.artist || '').toLowerCase().includes(filters.artist.toLowerCase())) return false
      if (filters.genre && !(item.genre || '').toLowerCase().includes(filters.genre.toLowerCase())) return false
      if (filters.q) {
        const query = filters.q.toLowerCase()
        const haystack = `${item.title || ''} ${item.artist || ''} ${item.subtype || ''}`.toLowerCase()
        if (!haystack.includes(query)) return false
      }
      return true
    })
  }, [index, filters])

  function toggleArrayFilter(key, value) {
    setFilters(prev => {
      const set = new Set(prev[key])
      if (set.has(value)) set.delete(value)
      else set.add(value)
      return { ...prev, [key]: [...set] }
    })
  }

  return (
    <div className="bg-card rounded-2xl p-3 mt-3">
      <p className="text-white text-sm font-semibold mb-2">Offline Filters (index.json)</p>
      <div className="flex flex-wrap gap-2 mb-2">
        {options.subtype.map(value => (
          <button
            key={value}
            onPointerDown={() => toggleArrayFilter('subtype', value)}
            className={`px-2 py-1 rounded-full text-xs ${filters.subtype.includes(value) ? 'bg-accent text-white' : 'bg-card-hover text-muted'}`}
          >
            {value}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mb-2">
        {options.filetype.map(value => (
          <button
            key={value}
            onPointerDown={() => toggleArrayFilter('filetype', value)}
            className={`px-2 py-1 rounded-full text-xs ${filters.filetype.includes(value) ? 'bg-accent text-white' : 'bg-card-hover text-muted'}`}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input
          value={filters.artist}
          onChange={event => setFilters(prev => ({ ...prev, artist: event.target.value }))}
          placeholder="Artist"
          className="bg-surface rounded-lg px-3 py-2 text-xs text-white outline-none"
        />
        <input
          value={filters.genre}
          onChange={event => setFilters(prev => ({ ...prev, genre: event.target.value }))}
          placeholder="Genre"
          className="bg-surface rounded-lg px-3 py-2 text-xs text-white outline-none"
        />
      </div>
      <input
        value={filters.q}
        onChange={event => setFilters(prev => ({ ...prev, q: event.target.value }))}
        placeholder="Search title/artist/subtype"
        className="w-full bg-surface rounded-lg px-3 py-2 mt-2 text-xs text-white outline-none"
      />

      <div className="mt-3 flex items-center justify-between">
        <p className="text-muted text-xs">{results.length} result{results.length !== 1 ? 's' : ''}</p>
        <button
          onPointerDown={() => onExport?.(results)}
          className="px-3 py-1.5 rounded-lg bg-accent text-white text-xs"
        >
          Export
        </button>
      </div>
    </div>
  )
}
