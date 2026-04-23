import React, { useEffect, useState } from 'react'
import { Share } from '@capacitor/share'
import { useApp } from '../context/AppContext'
import { sortLibrary } from '../lib/search'

export default function RemoteScreen() {
  const { library, remoteServerInfo, remoteStatus } = useApp()
  const [activeTab, setActiveTab]   = useState('songlist')  // songlist | remote
  const [qrSongList, setQrSongList] = useState(null)   // QR for song list page
  const [qrRemote, setQrRemote]     = useState(null)   // QR for remote control
  const [sharing, setSharing]       = useState(false)

  // ── QR generator ──────────────────────────────────────────────────────────
  async function generateQr(url, setter) {
    try {
      const QRCode = (await import('qrcode')).default
      const dataUrl = await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        color: { dark: '#7c3aed', light: '#0a0a12' },
      })
      setter(dataUrl)
    } catch (e) {}
  }

  // ── Share song list as plain text ─────────────────────────────────────────
  async function shareSongList() {
    setSharing(true)
    try {
      const sorted = sortLibrary(library)
      const lines = sorted.map(s =>
        `${s.number ? String(s.number).padStart(4, ' ') : '   —'} | ${s.title} — ${s.artist}`
      )
      const text = `MEDIA HUB SONG LIST\n${'─'.repeat(50)}\n NUM | TITLE — ARTIST\n${'─'.repeat(50)}\n${lines.join('\n')}`

      await Share.share({
        title: 'Media Hub Song List',
        text,
        dialogTitle: 'Share song list via…',
      })
    } catch (e) {
      if (e?.message !== 'Share canceled') console.error('Share error:', e)
    } finally {
      setSharing(false)
    }
  }

  useEffect(() => {
    if (!remoteServerInfo) return
    const base = `http://${remoteServerInfo.ip}:${remoteServerInfo.port}`
    Promise.all([
      generateQr(`${base}/songlist`, setQrSongList),
      generateQr(`${base}/remote`, setQrRemote),
    ])
  }, [remoteServerInfo?.ip, remoteServerInfo?.port])

  const sortedSongs = sortLibrary(library)
  const base = remoteServerInfo ? `http://${remoteServerInfo.ip}:${remoteServerInfo.port}` : null

  return (
    <div className="flex flex-col h-full screen-enter">
      {/* Header */}
      <div className="px-4 pt-4 pb-0 bg-surface border-b border-white/5 shrink-0">
        <h1 className="text-white font-bold text-xl mb-3">Share & Remote</h1>
        {/* Tabs */}
        <div className="flex">
          {[['songlist', 'Song List QR'], ['remote', 'Remote Control']].map(([id, label]) => (
            <button key={id} onPointerDown={() => setActiveTab(id)}
              className={`flex-1 py-2.5 text-sm font-medium touchable
                ${activeTab === id
                  ? 'text-accent-light border-b-2 border-accent'
                  : 'text-muted'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── SONG LIST TAB ─────────────────────────────────────────────────── */}
      {activeTab === 'songlist' && (
        <div className="flex-1 overflow-y-auto px-4 py-5">

          {/* QR Code — links to song list web page */}
          <div className="flex flex-col items-center mb-5">
            {qrSongList ? (
              <div className="bg-bg p-3 rounded-2xl border border-white/10">
                <img src={qrSongList} alt="Song list QR" style={{ width: 200, height: 200 }} />
              </div>
            ) : (
              <div className="w-52 h-52 bg-card rounded-2xl flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <p className="text-muted text-xs mt-3 text-center">
              Scan to view full numbered song list on any phone
            </p>
          </div>

          {/* URL */}
          {base && (
            <div className="bg-card rounded-2xl px-4 py-3 mb-4">
              <p className="text-muted text-xs mb-1">Or open in browser</p>
              <p className="text-accent-light font-mono text-sm">{base}/songlist</p>
            </div>
          )}

          {/* Share as text button */}
          <button
            className="w-full flex items-center justify-center gap-2 bg-accent text-white font-medium py-4 rounded-2xl touchable mb-4"
            onPointerDown={shareSongList}
            disabled={sharing}
          >
            {sharing ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            )}
            {sharing ? 'Preparing…' : 'Share via Bluetooth / WiFi / Message'}
          </button>

          {/* Song count */}
          <div className="bg-card rounded-2xl px-4 py-3 mb-4">
            <p className="text-white text-sm font-medium">{library.length.toLocaleString()} songs in library</p>
            <p className="text-muted text-xs mt-0.5">
              {sortedSongs.filter(s => s.number).length} numbered · {sortedSongs.filter(s => !s.number).length} unnumbered
            </p>
          </div>

          {/* Preview of first 20 songs */}
          <p className="text-muted text-xs font-medium uppercase tracking-wider mb-2">Preview</p>
          <div className="bg-card rounded-2xl overflow-hidden">
            {sortedSongs.slice(0, 20).map((s, i) => (
              <div key={s.id}
                className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0">
                <span className="text-accent-light text-xs font-mono w-8 text-right shrink-0">
                  {s.number ?? '—'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{s.title}</p>
                  <p className="text-muted text-xs truncate">{s.artist}</p>
                </div>
              </div>
            ))}
            {sortedSongs.length > 20 && (
              <div className="px-4 py-3 text-center">
                <p className="text-muted text-xs">+{sortedSongs.length - 20} more songs in full list</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── REMOTE CONTROL TAB ────────────────────────────────────────────── */}
      {activeTab === 'remote' && (
        <div className="flex-1 overflow-y-auto px-4 py-5">

          {/* Status */}
          <div className={`flex items-center gap-2 mb-5 px-4 py-3 rounded-xl text-sm
            ${remoteStatus === 'running'  ? 'bg-success/10 text-success' :
              remoteStatus === 'error'    ? 'bg-warning/10 text-warning' :
              'bg-accent/10 text-accent-light'}`}>
            {remoteStatus === 'running'
              ? <><span className="w-2 h-2 rounded-full bg-success" />Server running</>
              : remoteStatus === 'error'
              ? <><span className="w-2 h-2 rounded-full bg-warning" />Could not start server</>
              : <><div className="w-3 h-3 border border-accent border-t-transparent rounded-full animate-spin" />Starting…</>}
          </div>

          {/* QR */}
          <div className="flex flex-col items-center mb-5">
            {qrRemote ? (
              <div className="bg-bg p-3 rounded-2xl border border-white/10">
                <img src={qrRemote} alt="Remote QR" style={{ width: 200, height: 200 }} />
              </div>
            ) : (
              <div className="w-52 h-52 bg-card rounded-2xl flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <p className="text-muted text-xs mt-3 text-center">
              Scan to add songs to queue from any phone on the same WiFi
            </p>
          </div>

          {/* URL */}
          {base && (
            <div className="bg-card rounded-2xl px-4 py-3 mb-5">
              <p className="text-muted text-xs mb-1">Or open in browser</p>
              <p className="text-accent-light font-mono text-sm">{base}/remote</p>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-card rounded-2xl px-4 py-4">
            <p className="text-white font-medium text-sm mb-3">How it works</p>
            {[
              'All phones must be on the same WiFi network',
              'Scan the QR code or open the URL in Chrome',
              'Search for a song and tap + to add to queue',
              'Song appears instantly in the queue on this tablet',
            ].map((step, i) => (
              <div key={i} className="flex gap-3 mb-2 last:mb-0">
                <span className="w-5 h-5 rounded-full bg-accent/20 text-accent-light text-xs flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <p className="text-muted text-sm leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
