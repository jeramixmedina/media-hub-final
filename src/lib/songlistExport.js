import { sortLibrary } from './search'

export function buildSongListLines(library) {
  const sorted = sortLibrary(library)
  return sorted.map(song =>
    `${song.number ? String(song.number).padStart(4, ' ') : '   —'} | ${song.title} — ${song.artist}`
  )
}

export function buildSongListText(library) {
  const lines = buildSongListLines(library)
  return `MEDIA HUB SONG LIST\n${'─'.repeat(50)}\n NUM | TITLE — ARTIST\n${'─'.repeat(50)}\n${lines.join('\n')}`
}
