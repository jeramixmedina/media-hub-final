import React, { useState, useEffect, useCallback } from 'react'
import { Filesystem, Directory } from '@capacitor/filesystem'

export default function FolderBrowser({ onSelect, onClose }) {
  const [currentPath, setCurrentPath] = useState('')   // relative to ExternalStorage
  const [entries, setEntries]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)

  const breadcrumbs = currentPath ? currentPath.split('/') : []

  const loadDir = useCallback(async (path) => {
    setLoading(true)
    setError(null)
    try {
      const { files } = await Filesystem.readdir({
        path: path || '',
        directory: Directory.ExternalStorage,
      })

      // Show only directories (for folder selection)
      const dirs = files
        .filter(f => f.type === 'directory' && !f.name.startsWith('.'))
        .sort((a, b) => a.name.localeCompare(b.name))

      setEntries(dirs)
      setCurrentPath(path)
    } catch (err) {
      setError('Cannot read folder. Please grant storage permission in Settings.')
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadDir('') }, [])

  function goInto(name) {
    const next = currentPath ? `${currentPath}/${name}` : name
    loadDir(next)
  }

  function goUp() {
    const parts = currentPath.split('/')
    parts.pop()
    loadDir(parts.join('/'))
  }

  function selectCurrent() {
    onSelect(currentPath || '/')
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end" onPointerDown={onClose}>
      <div
        className="w-full bg-surface rounded-t-2xl max-h-[70vh] flex flex-col"
        onPointerDown={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <button className="text-muted touchable" onPointerDown={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-6 h-6">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>

          <div className="flex-1 text-center">
            <p className="text-white font-semibold text-sm">Select Folder</p>
            {/* Breadcrumb */}
            <p className="text-muted text-xs truncate mt-0.5">
              /{breadcrumbs.join('/')}
            </p>
          </div>

          {/* Select this folder button */}
          <button
            className="bg-accent text-white text-sm font-medium px-4 py-2 rounded-xl touchable"
            onPointerDown={selectCurrent}
          >
            Add
          </button>
        </div>

        {/* Back button */}
        {currentPath && (
          <button
            className="flex items-center gap-3 px-5 py-3.5 border-b border-white/5 touchable"
            onPointerDown={goUp}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-muted">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            <span className="text-white/70 text-sm">Back</span>
          </button>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {error && (
            <div className="px-5 py-8 text-center">
              <p className="text-warning text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && entries.length === 0 && (
            <div className="px-5 py-8 text-center">
              <p className="text-muted text-sm">No subfolders found.</p>
              <p className="text-muted text-xs mt-1">You can add this folder as a source.</p>
            </div>
          )}

          {!loading && entries.map(entry => (
            <button
              key={entry.name}
              className="w-full flex items-center gap-3 px-5 py-4 border-b border-white/5 touchable text-left"
              onPointerDown={() => goInto(entry.name)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-accent shrink-0">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              <span className="text-white text-sm truncate">{entry.name}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 text-muted ml-auto shrink-0">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
