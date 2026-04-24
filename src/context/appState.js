export const initialState = {
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

export function reducer(state, action) {
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
