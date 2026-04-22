import { Filesystem, Directory } from '@capacitor/filesystem'

const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mkv', '.avi', '.m4v']
const AUDIO_EXTENSIONS = ['.mp3', '.flac', '.aac', '.wav', '.ogg', '.m4a']
const ALL_EXTENSIONS   = [...VIDEO_EXTENSIONS, ...AUDIO_EXTENSIONS]

// ─── Filename Parser ──────────────────────────────────────────────────────────
// Format: "Song Title - Artist Name.mp4"
// Splits on the LAST occurrence of " - " so titles like
// "Bohemian Rhapsody - Live Version - Queen" correctly give:
//   title  = "Bohemian Rhapsody - Live Version"
//   artist = "Queen"

export function parseFilename(filename) {
  // Strip extension
  const nameNoExt = filename.replace(/\.[^/.]+$/, '')
  const lastDash = nameNoExt.lastIndexOf(' - ')

  if (lastDash === -1) {
    return { title: nameNoExt.trim(), artist: 'Unknown Artist' }
  }

  return {
    title: nameNoExt.slice(0, lastDash).trim(),
    artist: nameNoExt.slice(lastDash + 3).trim(),
  }
}

function isMediaFile(filename) {
  const lower = filename.toLowerCase()
  return ALL_EXTENSIONS.some(ext => lower.endsWith(ext))
}

function checkIsAudio(filename) {
  const lower = filename.toLowerCase()
  return AUDIO_EXTENSIONS.some(ext => lower.endsWith(ext))
}

// Generate a stable ID from the file path
function makeId(path) {
  let hash = 0
  for (let i = 0; i < path.length; i++) {
    hash = (Math.imul(31, hash) + path.charCodeAt(i)) | 0
  }
  return Math.abs(hash).toString(36)
}

// ─── Recursive Folder Scanner ─────────────────────────────────────────────────
// folderPath: relative path from ExternalStorage root, e.g. "Movies/Karaoke"
// Returns array of raw song objects (no numbers assigned yet)

export async function scanFolder(folderPath, onProgress) {
  const results = []
  await _scan(folderPath, results, onProgress)
  return results
}

async function _scan(path, results, onProgress) {
  let files
  try {
    const res = await Filesystem.readdir({
      path,
      directory: Directory.ExternalStorage,
    })
    files = res.files
  } catch (err) {
    console.warn(`Cannot read directory: ${path}`, err)
    return
  }

  for (const file of files) {
    // file.name is just the filename, not full path
    const fullPath = path ? `${path}/${file.name}` : file.name

    if (file.type === 'directory') {
      // Skip hidden directories (starting with .)
      if (!file.name.startsWith('.')) {
        await _scan(fullPath, results, onProgress)
      }
    } else if (isMediaFile(file.name)) {
      const { title, artist } = parseFilename(file.name)
      results.push({
        id: makeId(fullPath),
        title,
        artist,
        filePath: fullPath,
        number: null,
        isAudio: checkIsAudio(file.name),
      })
      onProgress && onProgress(results.length)
    }
  }
}

// ─── Library Merge ────────────────────────────────────────────────────────────
// Merge fresh scan with existing saved library.
// Preserves: number assignments, any custom title/artist edits.
// Adds:  newly found songs.
// Removes: songs whose files no longer exist (path not in fresh scan).

export function mergeWithExisting(freshSongs, existingLibrary) {
  const existingMap = new Map(existingLibrary.map(s => [s.id, s]))

  // Feature 4: find the highest existing number so we can continue from there
  const maxNum = existingLibrary.reduce((max, s) => {
    const n = parseInt(s.number)
    return !isNaN(n) && n > max ? n : max
  }, 0)

  // Collect only truly NEW songs (not in existing library)
  const newSongs = freshSongs.filter(s => !existingMap.has(s.id))

  // Sort new songs alphabetically for consistent, predictable numbering
  newSongs.sort((a, b) => a.title.localeCompare(b.title))

  // Assign sequential numbers starting after the current max
  let nextNum = maxNum + 1
  const autoNumbers = new Map()
  newSongs.forEach(s => {
    autoNumbers.set(s.id, String(nextNum++))
  })

  return freshSongs.map(fresh => {
    const existing = existingMap.get(fresh.id)
    if (existing) {
      // Preserve manually set fields for existing songs
      return {
        ...fresh,
        number: existing.number ?? null,
        title:  existing.title  ?? fresh.title,
        artist: existing.artist ?? fresh.artist,
      }
    }
    // New song — auto-assign number
    return {
      ...fresh,
      number: autoNumbers.get(fresh.id) ?? null,
    }
  })
}

// ─── Scan Multiple Folders ────────────────────────────────────────────────────

export async function scanAllFolders(folders, existingLibrary, onProgress) {
  let allSongs = []

  for (const folder of folders) {
    const songs = await scanFolder(folder, count => {
      onProgress && onProgress(allSongs.length + count)
    })
    allSongs = [...allSongs, ...songs]
  }

  // Deduplicate by id (same file referenced from multiple source folders)
  const seen = new Set()
  const unique = allSongs.filter(s => {
    if (seen.has(s.id)) return false
    seen.add(s.id)
    return true
  })

  // Merge with existing to preserve numbers
  return mergeWithExisting(unique, existingLibrary)
}
