import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import {
  loadLibrary, saveLibrary,
  loadFavorites, saveFavorites,
  loadSourceFolders, saveSourceFolders,
} from '../lib/storage'
import { scanAllFolders } from '../lib/scanner'
import { buildIndex } from '../lib/search'
import LocalServer from '../plugins/LocalServer'
import { initialState, reducer } from './appState'

// ─── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const libraryRef = useRef(state.library)

  // ── Boot: load persisted data ──────────────────────────────────────────────
  useEffect(() => {
    async function boot() {
      const [library, favorites, sourceFolders] = await Promise.all([
        loadLibrary(),
        loadFavorites(),
        loadSourceFolders(),
      ])
      buildIndex(library)
      dispatch({ type: 'LOAD_COMPLETE', library, favorites, sourceFolders })
    }
    boot()
  }, [])

  // ── Persist library changes ────────────────────────────────────────────────
  useEffect(() => {
    if (state.hasLibrary) {
      saveLibrary(state.library)
      buildIndex(state.library)
    }
  }, [state.library, state.hasLibrary])

  useEffect(() => {
    saveFavorites(state.favorites)
  }, [state.favorites])

  useEffect(() => {
    saveSourceFolders(state.sourceFolders)
  }, [state.sourceFolders])

  useEffect(() => {
    libraryRef.current = state.library
  }, [state.library])

  // ── Remote server: keep alive app-wide so phone QR works on any screen ───
  const [remoteServerInfo, setRemoteServerInfo] = React.useState(null)
  const [remoteStatus, setRemoteStatus] = React.useState('starting')

  useEffect(() => {
    let cancelled = false
    let pollTimer = null

    async function bootRemote() {
      try {
        const info = await LocalServer.start()
        if (cancelled) return
        setRemoteServerInfo(info)
        setRemoteStatus('running')

        pollTimer = setInterval(async () => {
          try {
            const cmd = await LocalServer.popCommand()
            if (cmd?.songId) {
              const song = libraryRef.current.find(s => s.id === cmd.songId)
              if (song) dispatch({ type: 'ADD_TO_QUEUE', song })
            }
          } catch (e) {}
        }, 1000)
      } catch (e) {
        if (cancelled) return
        setRemoteStatus('error')
      }
    }

    bootRemote()

    return () => {
      cancelled = true
      if (pollTimer) clearInterval(pollTimer)
      LocalServer.stop().catch(() => {})
    }
  }, [])

  // ── Keep now-playing status synced for remote page ────────────────────────
  useEffect(() => {
    async function syncStatus() {
      try {
        await Filesystem.writeFile({
          path: 'remote-status.json',
          data: JSON.stringify({
            currentSong: state.currentSong
              ? {
                  id: state.currentSong.id,
                  title: state.currentSong.title,
                  artist: state.currentSong.artist,
                }
              : null,
            queueLength: state.queue.length,
          }),
          directory: Directory.Data,
          encoding: Encoding.UTF8,
        })
      } catch (e) {}
    }
    syncStatus()
  }, [state.currentSong?.id, state.queue.length])

  // ── Actions ────────────────────────────────────────────────────────────────

  const scanLibrary = useCallback(async () => {
    if (state.sourceFolders.length === 0) return
    dispatch({ type: 'SCAN_START' })
    try {
      const songs = await scanAllFolders(
        state.sourceFolders,
        state.library,
        count => dispatch({ type: 'SCAN_PROGRESS', count })
      )
      dispatch({ type: 'SCAN_COMPLETE', library: songs })
    } catch (err) {
      console.error('Scan failed:', err)
      dispatch({ type: 'SCAN_COMPLETE', library: state.library })
    }
  }, [state.sourceFolders, state.library])

  const addToQueue    = useCallback(song => dispatch({ type: 'ADD_TO_QUEUE', song }), [])
  const addNextInQueue = useCallback(song => dispatch({ type: 'ADD_NEXT_IN_QUEUE', song }), [])
  const removeFromQueue = useCallback(index => dispatch({ type: 'REMOVE_FROM_QUEUE', index }), [])
  const reorderQueue  = useCallback(queue => dispatch({ type: 'REORDER_QUEUE', queue }), [])
  const clearQueue    = useCallback(() => dispatch({ type: 'CLEAR_QUEUE' }), [])
  const playNow       = useCallback(song => dispatch({ type: 'PLAY_NOW', song }), [])
  const setPlaying    = useCallback(value => dispatch({ type: 'SET_PLAYING', value }), [])
  const songEnded     = useCallback(() => dispatch({ type: 'SONG_ENDED' }), [])
  const toggleFavorite = useCallback(id => dispatch({ type: 'TOGGLE_FAVORITE', id }), [])
  const updateSongNumber = useCallback((id, number) => dispatch({ type: 'UPDATE_SONG_NUMBER', id, number }), [])
  const updateSongMeta = useCallback((id, changes) => dispatch({ type: 'UPDATE_SONG_META', id, changes }), [])
  const addSourceFolder = useCallback(folder => dispatch({ type: 'ADD_SOURCE_FOLDER', folder }), [])
  const removeSourceFolder = useCallback(folder => dispatch({ type: 'REMOVE_SOURCE_FOLDER', folder }), [])

  const value = {
    ...state,
    remoteServerInfo,
    remoteStatus,
    scanLibrary,
    addToQueue,
    addNextInQueue,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    playNow,
    setPlaying,
    songEnded,
    toggleFavorite,
    updateSongNumber,
    updateSongMeta,
    addSourceFolder,
    removeSourceFolder,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
