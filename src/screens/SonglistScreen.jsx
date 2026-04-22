import React, { useState, useMemo, useCallback, useRef } from 'react'
import { FixedSizeList as List } from 'react-window'
import { useApp } from '../context/AppContext'
import { sortLibrary } from '../lib/search'
import { Share } from '@capacitor/share'

const ROW_HEIGHT = 56

export default function SonglistScreen() {
  const { library } = useApp()
  const [tab, setTab]           = useState('list')   // list | qr
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [filter, setFilter]     = useState('')
  const [containerHeight, setContainerHeight] = useState(500)

  const measuredRef = useCallback(node => {
    if (!node) return
    const ro = new ResizeObserver(([e]) => setContainerHeight(e.contentRect.height))
    ro.observe(node)
  }, [])

  const numbered = useMemo(() => {
    const q = filter.toLowerCase()
    const sorted = sortLibrary(library).filter(s => s.number != null)
    if (!q) return sorted
    return sorted.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.artist.toLowerCase().includes(q) ||
      String(s.number).includes(q)
    )
  }, [library, filter])

  const numberedCount = useMemo(() => library.filter(s => s.number != null).length, [library])

  // ── Generate songlist HTML for sharing ──────────────────────────────────────
  function buildHtml() {
    const sorted = sortLibrary(library).filter(s => s.number != null)
    const rows = sorted.map(s =>
      `<tr><td>${s.number}</td><td>${esc(s.title)}</td><td>${esc(s.artist)}</td></tr>`
    ).join('')
    return `<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Song List</title>
<style>
body{font-family:system-ui,sans-serif;background:#0a0a12;color:#f1f5f9;margin:0;padding:16px}
h1{font-size:20px;color:#a78bfa;margin-bottom:16px}
table{width:100%;border-collapse:collapse;font-size:14px}
th{text-align:left;color:#475569;font-size:12px;padding:6px 8px;border-bottom:1px solid #ffffff15}
td{padding:10px 8px;border-bottom:1px solid #ffffff08}
td:first-child{color:#a78bfa;font-family:monospace;width:48px}
td:last-child{color:#94a3b8}
tr:active{background:#1a1a2e}
</style></head><body>
<h1>Song List (${sorted.length} songs)</h1>
<table><thead><tr><th>#</th><th>Title</th><th>Artist</th></tr></thead>
<tbody>${rows}</tbody></table></body></html>`
  }

  function esc(s) {
    return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  // ── Share as HTML file via Android share sheet ───────────────────────────
  async function handleShare() {
    try {
      const html = buildHtml()
      const b64  = btoa(unescape(encodeURIComponent(html)))
      await Share.share({
        title: 'Song List',
        text:  `Song list with ${numberedCount} songs`,
        url:   `data:text/html;base64,${b64}`,
        dialogTitle: 'Share song list',
      })
    } catch (e) {
      console.error('Share error:', e)
    }
  }

  // ── Generate QR containing compact plain-text songlist ───────────────────
  async function generateQr() {
    setQrLoading(true)
    try {
      const sorted = sortLibrary(library).filter(s => s.number != null)
      // QR can hold ~3kb comfortably — use compact text format
      // If library is large, include first 200 numbered songs
      const chunk  = sorted.slice(0, 200)
      const text   = chunk.map(s => `${s.number}. ${s.title} - ${s.artist}`).join('\n')
      const suffix = sorted.length > 200 ? `\n... and ${sorted.length - 200} more` : ''

      const QRCode  = (await import('qrcode')).default
      const dataUrl = await QRCode.toDataURL(text + suffix, {
        width:        320,
        margin:       2,
        errorCorrectionLevel: 'L',
        color: { dark: '#7c3aed', light: '#0a0a12' },
      })
      setQrDataUrl(dataUrl)
    } catch (e) {
      console.error('QR error:', e)
    } finally {
      setQrLoading(false)
    }
  }

  const Row = useCallback(({ index, style }) => {
    const s = numbered[index]
    return (
      <div style={style} className="flex items-center gap-3 px-4 border-b border-white/5">
        <span className="text-accent-light font-mono text-sm w-10 shrink-0 text-right">{s.number}</span>
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{s.title}</p>
          <p className="text-muted text-xs truncate">{s.artist}</p>
        </div>
      </div>
    )
  }, [numbered])

  return (
    <div className="flex flex-col h-full screen-enter">

      {/* Header */}
      <div className="px-4 pt-4 pb-3 bg-surface border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <h1 className="text-white font-bold text-xl flex-1">Song List</h1>
          <span className="text-muted text-sm">{numberedCount} numbered</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-3">
          {[['list', 'Song List'], ['qr', 'QR Code']].map(([id, label]) => (
            <button key={id} onPointerDown={() => setTab(id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium touchable
                ${tab === id ? 'bg-accent text-white' : 'bg-card text-muted'}`}>
              {label}
            </button>
          ))}

          {/* Share button — always visible */}
          <button
            onPointerDown={handleShare}
            className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-card rounded-xl text-sm text-accent-light touchable"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
              <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
            Share
          </button>
        </div>

        {/* Search — only on list tab */}
        {tab === 'list' && (
          <div className="relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Filter by number, title or artist…"
              className="w-full bg-card text-white placeholder-muted text-sm rounded-xl pl-9 pr-4 py-3 outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        )}
      </div>

      {/* ── LIST TAB ───────────────────────────────────────────────────────── */}
      {tab === 'list' && (
        <>
          {library.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 px-8 text-center">
              <p className="text-white font-medium">No songs yet</p>
              <p className="text-muted text-sm">Scan your library in Settings first.</p>
            </div>
          ) : numbered.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 px-8 text-center">
              <p className="text-white font-medium">No numbered songs</p>
              <p className="text-muted text-sm">Numbers are auto-assigned when you scan. You can also edit them in Settings → Song Numbers.</p>
            </div>
          ) : (
            <div ref={measuredRef} className="flex-1 overflow-hidden">
              <List height={containerHeight} itemCount={numbered.length} itemSize={ROW_HEIGHT} width="100%">
                {Row}
              </List>
            </div>
          )}
        </>
      )}

      {/* ── QR TAB ─────────────────────────────────────────────────────────── */}
      {tab === 'qr' && (
        <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col items-center gap-5">

          {!qrDataUrl && !qrLoading && (
            <>
              <div className="bg-card rounded-2xl px-4 py-4 w-full">
                <p className="text-white font-medium text-sm mb-1">What this QR contains</p>
                <p className="text-muted text-xs leading-relaxed">
                  A plain-text list of all numbered songs (up to 200). Anyone can scan it with any phone camera — no app needed. Shows: song number, title, artist.
                </p>
              </div>
              <button
                onPointerDown={generateQr}
                className="bg-accent text-white font-medium px-8 py-4 rounded-2xl text-base touchable"
              >
                Generate QR Code
              </button>
            </>
          )}

          {qrLoading && (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-muted text-sm">Generating…</p>
            </div>
          )}

          {qrDataUrl && (
            <>
              <div className="bg-bg p-3 rounded-2xl border border-white/10">
                <img src={qrDataUrl} alt="Songlist QR" style={{ width: 280, height: 280 }} />
              </div>
              <p className="text-muted text-xs text-center px-4">
                Scan with any phone camera. Shows up to 200 numbered songs.
              </p>
              <button
                onPointerDown={generateQr}
                className="bg-card text-muted text-sm px-6 py-3 rounded-xl touchable"
              >
                Regenerate
              </button>
            </>
          )}

          {/* Share button big */}
          <div className="w-full bg-card rounded-2xl px-4 py-4">
            <p className="text-white font-medium text-sm mb-1">Share full list</p>
            <p className="text-muted text-xs mb-3">
              Sends the complete songlist as an HTML file — readable in any phone browser. Works via Bluetooth, WiFi, or any share option.
            </p>
            <button
              onPointerDown={handleShare}
              className="w-full flex items-center justify-center gap-2 bg-accent text-white font-medium py-3 rounded-xl touchable"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
              Share song list ({numberedCount} songs)
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
