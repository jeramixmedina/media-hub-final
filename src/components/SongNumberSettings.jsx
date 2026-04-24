import React, { useState } from 'react'

export default function SongNumberSettings({ config = {}, onSaveConfig, runAutoNumbering }) {
  const [mode, setMode] = useState(config.mode || 'auto')
  const [folders, setFolders] = useState(config.autoRules?.folders || [])
  const [pattern, setPattern] = useState(config.autoRules?.pattern || '{folder_prefix}-{seq:04d}')
  const [start, setStart] = useState(config.autoRules?.start || 1)
  const [scope, setScope] = useState(config.autoRules?.scope || 'folder')
  const [applyToTags, setApplyToTags] = useState(config.applyToTags || false)

  function addFolder() {
    const folder = window.prompt('Enter folder path')
    if (!folder) return
    setFolders(prev => [...prev, folder])
  }

  function removeFolder(index) {
    setFolders(prev => prev.filter((_, idx) => idx !== index))
  }

  function save() {
    const payload = {
      mode,
      autoRules: {
        folders,
        pattern,
        start: Number(start),
        increment: 1,
        scope,
      },
      applyToTags,
    }
    onSaveConfig?.(payload)
  }

  async function previewRun() {
    if (!runAutoNumbering) return
    const preview = await runAutoNumbering({
      folders,
      pattern,
      start,
      scope,
      apply: false,
      write_tags: false,
    })
    window.alert((preview || []).slice(0, 20).map(item => `${item[0]} -> ${item[1]}`).join('\n'))
  }

  async function applyRun() {
    if (!runAutoNumbering) return
    if (!window.confirm('Apply numbering now?')) return
    await runAutoNumbering({
      folders,
      pattern,
      start,
      scope,
      apply: true,
      write_tags: applyToTags,
    })
    window.alert('Numbering applied.')
  }

  return (
    <div className="bg-card rounded-2xl p-3 mt-3">
      <p className="text-white text-sm font-semibold mb-2">Song Number Settings</p>
      <div className="flex gap-3 text-xs mb-3">
        <label className="text-muted"><input type="radio" checked={mode === 'manual'} onChange={() => setMode('manual')} /> Manual</label>
        <label className="text-muted"><input type="radio" checked={mode === 'auto'} onChange={() => setMode('auto')} /> Auto Generate Filters</label>
      </div>

      {mode === 'auto' && (
        <>
          <div className="flex flex-wrap gap-2 mb-2">
            {folders.map((folder, index) => (
              <span key={`${folder}-${index}`} className="px-2 py-1 rounded-full bg-surface text-xs text-muted">
                {folder}
                <button onPointerDown={() => removeFolder(index)} className="ml-2 text-warning">×</button>
              </span>
            ))}
            <button onPointerDown={addFolder} className="px-2 py-1 rounded-full bg-accent text-white text-xs">Add Folder</button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input value={pattern} onChange={event => setPattern(event.target.value)} className="bg-surface rounded px-2 py-1 text-xs text-white" />
            <input type="number" value={start} onChange={event => setStart(event.target.value)} className="bg-surface rounded px-2 py-1 text-xs text-white" />
          </div>

          <div className="flex items-center gap-2 mt-2">
            <select value={scope} onChange={event => setScope(event.target.value)} className="bg-surface rounded px-2 py-1 text-xs text-white">
              <option value="folder">Per Folder</option>
              <option value="global">Global</option>
            </select>
            <label className="text-muted text-xs">
              <input type="checkbox" checked={applyToTags} onChange={event => setApplyToTags(event.target.checked)} /> Write tags
            </label>
          </div>

          <div className="flex gap-2 mt-3">
            <button onPointerDown={previewRun} className="px-3 py-1.5 rounded bg-surface text-white text-xs">Preview</button>
            <button onPointerDown={applyRun} className="px-3 py-1.5 rounded bg-accent text-white text-xs">Apply</button>
          </div>
        </>
      )}

      {mode === 'manual' && (
        <p className="text-muted text-xs">Manual mode: edit song metadata directly from the list editor.</p>
      )}

      <button onPointerDown={save} className="mt-3 px-3 py-1.5 rounded bg-card-hover text-white text-xs">
        Save Settings
      </button>
    </div>
  )
}
