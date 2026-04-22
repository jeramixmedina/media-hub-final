import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react'
import {
  loadLibrary, saveLibrary,
  loadFavorites, saveFavorites,
  loadSourceFolders, saveSourceFolders,
} from '../lib/storage'
import { scanAllFolders } from '../lib/scanner'
import { buildIndex } from '../lib/search'

// ─── State Shape ──────────────────────────────────────────────────────────────

const initialState = {
  library:       [],      // all scanned songs
  queue:         [],      // upcoming songs (ordered)
  currentSong:   null,    // currently playing
  isPlaying:     false,
  favorites:     [],      // array of song ids
  sourceFolders: [],      // folder paths (relative to ExternalStorage)
  isScanning:    false,
  scanCount:     0,       // live count during scan
  hasLibrary:    false,   // true once first scan completed
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {

    case 'LOAD_COMPLETE':
      return {
        ...state,
        library:       action.library,
        favorites:     action.favorites,
        sourceFolders: action.sourceFolders,
        hasLibrary:    action.library.length > 0,
      }

    case 'SCAN_START':
      return { ...state, isScanning: true, scanCount: 0 }

    case 'SCAN_PROGRESS':
      return { ...state, scanCount: action.count }

    case 'SCAN_COMPLETE':
      return {
        ...state,
        library: action.library,
        isScanning: false,
        scanCount: 0,
        hasLibrary: action.library.length > 0,
      }

    case 'ADD_SOURCE_FOLDER':
      if (state.sourceFolders.includes(action.folder)) return state
      return { ...state, sourceFolders: [...state.sourceFolders, action.folder] }

    case 'REMOVE_SOURCE_FOLDER':
      return { ...state, sourceFolders: state.sourceFolders.filter(f => f !== action.folder) }

    case 'ADD_TO_QUEUE':
      return { ...state, queue: [...state.queue, action.song] }

    case 'ADD_NEXT_IN_QUEUE': {
      const [head, ...tail] = state.queue
      // If something is already playing, insert after current (position 0)
      // Otherwise insert at position 0
      return state.currentSong
        ? { ...state, queue: [head, action.song, ...tail].filter(Boolean) }
        : { ...state, queue: [action.song, ...state.queue] }
    }

    case 'REMOVE_FROM_QUEUE':
      return { ...state, queue: state.queue.filter((_, i) => i !== action.index) }

    case 'REORDER_QUEUE':
      return { ...state, queue: action.queue }

    case 'CLEAR_QUEUE':
      return { ...state, queue: [] }

    case 'PLAY_NOW':
      return { ...state, currentSong: action.song, isPlaying: true }

    case 'SET_PLAYING':
      return { ...state, isPlaying: action.value }

    // Called when a song ends — pop next from queue
    case 'SONG_ENDED': {
      if (state.queue.length === 0) {
        return { ...state, currentSong: null, isPlaying: false }
      }
      const [next, ...rest] = state.queue
      return { ...state, currentSong: next, queue: rest, isPlaying: true }
    }

    case 'TOGGLE_FAVORITE': {
      const id = action.id
      const favs = state.favorites.includes(id)
        ? state.favorites.filter(f => f !== id)
        : [...state.favorites, id]
      return { ...state, favorites: favs }
    }

    case 'UPDATE_SONG_NUMBER': {
      const library = state.library.map(s =>
        s.id === action.id
          ? { ...s, number: action.number === '' ? null : action.number }
          : s
      )
      return { ...state, library }
    }

    case 'UPDATE_SONG_META': {
      const library = state.library.map(s =>
        s.id === action.id ? { ...s, ...action.changes } : s
      )
      return { ...state, library }
    }

    default:
      return state
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

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
