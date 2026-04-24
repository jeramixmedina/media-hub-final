import React, { useState, useMemo } from 'react'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { useApp } from '../context/AppContext'
import FolderBrowser from '../components/FolderBrowser'
import SongNumberSettings from '../components/SongNumberSettings'
import { sortLibrary } from '../lib/search'
import { buildSongListLines } from '../lib/songlistExport'
import { buildSimpleTextPdfBase64 } from '../lib/pdf'

export default function Settings() {
  const {
    sourceFolders, addSourceFolder, removeSourceFolder,
    scanLibrary, isScanning, scanCount, library,
    updateSongNumber, updateSongMeta,
  } = useApp()

  const [showFolderBrowser, setShowFolderBrowser] = useState(false)
  const [activeTab, setActiveTab]                 = useState('folders') // folders | numbers
  const [editSearch, setEditSearch]               = useState('')
  const [editingId, setEditingId]                 = useState(null)
  const [editValues, setEditValues]               = useState({})
  const [savedId, setSavedId]                     = useState(null)
  const [isExportingPdf, setIsExportingPdf]       = useState(false)
  const [exportMessage, setExportMessage]         = useState('')
  const [numberSettings, setNumberSettings]       = useState({})

  // Songs for number editor
  const editorSongs = useMemo(() => {
    const sorted = sortLibrary(library)
    if (!editSearch.trim()) return sorted
    const q = editSearch.toLowerCase()
    return sorted.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.artist.toLowerCase().includes(q) ||
      String(s.number ?? '').includes(q)
    )
  }, [library, editSearch])

  function handleFolderSelect(path) {
    addSourceFolder(path)
    setShowFolderBrowser(false)
  }

  function startEdit(song) {
    setEditingId(song.id)
    setEditValues({ number: song.number ?? '', title: song.title, artist: song.artist })
  }

  function saveEdit(song) {
    const num = editValues.number?.toString().trim()
    updateSongNumber(song.id, num === '' ? null : num)
    updateSongMeta(song.id, {
      title: editValues.title?.trim() || song.title,
      artist: editValues.artist?.trim() || song.artist,
    })
    setEditingId(null)
    setSavedId(song.id)
    setTimeout(() => setSavedId(null), 1500)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditValues({})
  }

  async function exportSongListPdf() {
    if (isExportingPdf) return
    setIsExportingPdf(true)
    setExportMessage('')
    try {
      const lines = [
        'MEDIA HUB SONG LIST',
        '--------------------------------------------------',
        ' NUM | TITLE — ARTIST',
        '--------------------------------------------------',
        ...buildSongListLines(library),
      ]
      const data = buildSimpleTextPdfBase64(lines)
      const stamp = new Date().toISOString().slice(0, 10)
      const filename = `MediaHub_SongList_${stamp}.pdf`

      await Filesystem.writeFile({
        path: filename,
        data,
        directory: Directory.Documents,
        recursive: true,
      })
      setExportMessage(`Saved to Documents/${filename}`)
    } catch (err) {
      console.error('Export PDF failed:', err)
      setExportMessage('Could not export PDF. Please try again.')
    } finally {
      setIsExportingPdf(false)
    }
  }

  async function runAutoNumberingStub(payload) {
    console.log('Auto numbering payload (stub):', payload)
    return []
  }

  return (
    <div className="flex flex-col h-full screen-enter">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 bg-surface border-b border-white/5 shrink-0">
        <h1 className="text-white font-bold text-xl">Settings</h1>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface border-b border-white/5 shrink-0">
        {[['folders', 'Folders & Scan'], ['numbers', 'Song Numbers']].map(([id, label]) => (
          <button
            key={id}
            onPointerDown={() => setActiveTab(id)}
            className={`flex-1 py-3 text-sm font-medium touchable
              ${activeTab === id
                ? 'text-accent-light border-b-2 border-accent'
                : 'text-muted'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── FOLDERS TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'folders' && (
        <div className="flex-1 overflow-y-auto">
          {/* Source folders section */}
          <div className="px-4 pt-5">
            <p className="text-muted text-xs font-medium uppercase tracking-wider mb-3">Video folders</p>

            {sourceFolders.length === 0 && (
              <div className="bg-card rounded-2xl px-4 py-5 text-center mb-3">
                <p className="text-muted text-sm">No folders added yet.</p>
                <p className="text-muted text-xs mt-1">Add a folder where your videos are saved.</p>
              </div>
            )}

            {sourceFolders.map(folder => (
              <div key={folder} className="flex items-center gap-3 bg-card rounded-2xl px-4 py-3 mb-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 text-accent shrink-0">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                <span className="text-white text-sm flex-1 truncate">{folder || '/ (root)'}</span>
                <button
                  className="text-warning touchable w-8 h-8 flex items-center justify-center"
                  onPointerDown={() => removeSourceFolder(folder)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14H6L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                  </svg>
                </button>
              </div>
            ))}

            {/* Add folder button */}
            <button
              className="w-full flex items-center justify-center gap-2 border border-dashed border-accent/40 rounded-2xl py-4 text-accent-light text-sm touchable mt-1"
              onPointerDown={() => setShowFolderBrowser(true)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Add folder
            </button>
          </div>

          {/* Scan section */}
          <div className="px-4 pt-6 pb-8">
            <p className="text-muted text-xs font-medium uppercase tracking-wider mb-3">Library</p>
            <div className="bg-card rounded-2xl px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-white font-medium">Scan library</p>
                  <p className="text-muted text-xs mt-0.5">{library.length.toLocaleString()} songs indexed</p>
                </div>
                <button
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl text-white font-medium text-sm touchable
                    ${isScanning ? 'bg-muted' : 'bg-accent'}`}
                  onPointerDown={() => !isScanning && scanLibrary()}
                  disabled={isScanning}
                >
                  {isScanning ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {scanCount}
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                        <polyline points="1 4 1 10 7 10"/>
                        <path d="M3.51 15a9 9 0 1 0 .49-3.5"/>
                      </svg>
                      Scan
                    </>
                  )}
                </button>
              </div>
              <p className="text-muted text-xs">
                Run a scan after adding new videos. Existing song numbers are preserved.
              </p>
            </div>

            <div className="bg-card rounded-2xl px-4 py-4 mt-4">
              <div className="flex items-center justify-between mb-2 gap-3">
                <div>
                  <p className="text-white font-medium">Export Song List PDF</p>
                  <p className="text-muted text-xs mt-0.5">Offline copy of the same numbered list used for Song List sharing.</p>
                </div>
                <button
                  className={`px-4 py-2 rounded-xl text-white text-sm font-medium touchable ${isExportingPdf ? 'bg-muted' : 'bg-accent'}`}
                  onPointerDown={exportSongListPdf}
                  disabled={isExportingPdf}
                >
                  {isExportingPdf ? 'Exporting…' : 'Export PDF'}
                </button>
              </div>
              {exportMessage && <p className="text-muted text-xs">{exportMessage}</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── NUMBERS TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'numbers' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 shrink-0">
            <SongNumberSettings
              config={numberSettings}
              onSaveConfig={setNumberSettings}
              runAutoNumbering={runAutoNumberingStub}
            />
          </div>
          <div className="px-4 py-3 border-b border-white/5 shrink-0">
            <div className="relative">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                value={editSearch}
                onChange={e => setEditSearch(e.target.value)}
                placeholder="Filter songs…"
                className="w-full bg-card text-white placeholder-muted text-sm rounded-xl pl-9 pr-4 py-3 outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <p className="text-muted text-xs mt-2">Tap a song to assign a number and edit its name.</p>
          </div>

          <div className="flex-1 overflow-y-auto pb-4">
            {editorSongs.map(song => (
              <div key={song.id} className="border-b border-white/5">
                {editingId === song.id ? (
                  /* Edit mode */
                  <div className="px-4 py-3 bg-card-hover">
                    <div className="flex gap-2 mb-2">
                      <div className="w-20 shrink-0">
                        <label className="text-muted text-xs block mb-1">Number</label>
                        <input
                          type="number"
                          value={editValues.number}
                          onChange={e => setEditValues(v => ({ ...v, number: e.target.value }))}
                          placeholder="—"
                          className="w-full bg-card text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-accent"
                          autoFocus
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-muted text-xs block mb-1">Title</label>
                        <input
                          type="text"
                          value={editValues.title}
                          onChange={e => setEditValues(v => ({ ...v, title: e.target.value }))}
                          className="w-full bg-card text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-accent"
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted text-xs block mb-1">Artist</label>
                      <input
                        type="text"
                        value={editValues.artist}
                        onChange={e => setEditValues(v => ({ ...v, artist: e.target.value }))}
                        className="w-full bg-card text-white text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="flex-1 bg-accent text-white text-sm font-medium py-2 rounded-xl touchable"
                        onPointerDown={() => saveEdit(song)}
                      >
                        Save
                      </button>
                      <button
                        className="flex-1 bg-card text-muted text-sm py-2 rounded-xl touchable"
                        onPointerDown={cancelEdit}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Display mode */
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 text-left touchable active:bg-card"
                    onPointerDown={() => startEdit(song)}
                  >
                    <span className={`text-sm font-mono w-10 shrink-0 text-right
                      ${song.number ? 'text-accent-light' : 'text-muted'}`}>
                      {song.number ?? '—'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{song.title}</p>
                      <p className="text-muted text-xs truncate">{song.artist}</p>
                    </div>
                    {savedId === song.id && (
                      <span className="text-success text-xs shrink-0">Saved ✓</span>
                    )}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                      className="w-4 h-4 text-muted shrink-0">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Folder browser modal */}
      {showFolderBrowser && (
        <FolderBrowser
          onSelect={handleFolderSelect}
          onClose={() => setShowFolderBrowser(false)}
        />
      )}
    </div>
  )
}
