import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import { Preferences } from '@capacitor/preferences'

const FILES = {
  MEDIA: 'media.json',
  QUEUE: 'queue.json',
}

// ─── Media Library ────────────────────────────────────────────────────────────

export async function loadLibrary() {
  try {
    const { data } = await Filesystem.readFile({
      path: FILES.MEDIA,
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    })
    return JSON.parse(data) || []
  } catch {
    return []
  }
}

export async function saveLibrary(songs) {
  await Filesystem.writeFile({
    path: FILES.MEDIA,
    data: JSON.stringify(songs),
    directory: Directory.Data,
    encoding: Encoding.UTF8,
  })
}

// ─── Favorites ────────────────────────────────────────────────────────────────

export async function loadFavorites() {
  const { value } = await Preferences.get({ key: 'favorites' })
  return value ? JSON.parse(value) : []
}

export async function saveFavorites(ids) {
  await Preferences.set({ key: 'favorites', value: JSON.stringify(ids) })
}

// ─── Source Folders ───────────────────────────────────────────────────────────

export async function loadSourceFolders() {
  const { value } = await Preferences.get({ key: 'sourceFolders' })
  return value ? JSON.parse(value) : []
}

export async function saveSourceFolders(folders) {
  await Preferences.set({ key: 'sourceFolders', value: JSON.stringify(folders) })
}

// ─── Base URI (ExternalStorage root) ─────────────────────────────────────────
// Cached so we only call getUri once per session

let _baseUri = null

export async function getExternalBaseUri() {
  if (_baseUri) return _baseUri
  try {
    const { uri } = await Filesystem.getUri({
      path: '',
      directory: Directory.ExternalStorage,
    })
    // uri comes as "file:///storage/emulated/0" — strip trailing slash
    _baseUri = uri.replace(/\/$/, '')
    return _baseUri
  } catch {
    return 'file:///storage/emulated/0'
  }
}

// Convert a relative path (e.g. "Movies/song.mp4") to a full file:// URI
export async function toFileUri(relativePath) {
  const base = await getExternalBaseUri()
  return `${base}/${relativePath}`
}

// ─── Filesystem Permission ────────────────────────────────────────────────────

export async function requestStoragePermission() {
  try {
    const result = await Filesystem.requestPermissions()
    return result.publicStorage === 'granted'
  } catch {
    return false
  }
}

export async function checkStoragePermission() {
  try {
    const result = await Filesystem.checkPermissions()
    return result.publicStorage === 'granted'
  } catch {
    return false
  }
}
