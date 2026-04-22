import Fuse from 'fuse.js'

let fuseInstance = null
let indexedLibrary = null

// ─── Build Search Index ───────────────────────────────────────────────────────
// Call this once after the library loads or changes.

export function buildIndex(library) {
  indexedLibrary = library
  fuseInstance = new Fuse(library, {
    keys: [
      { name: 'title',  weight: 0.6 },
      { name: 'artist', weight: 0.3 },
      { name: 'number', weight: 0.1 },
    ],
    threshold: 0.35,       // 0 = exact, 1 = match anything
    minMatchCharLength: 1,
    includeScore: true,
    ignoreLocation: true,  // match anywhere in the string
  })
}

// ─── Search ───────────────────────────────────────────────────────────────────
// Returns filtered/sorted songs.
// - Empty query → return full library (sorted by number then title)
// - Pure number query → instant exact match first, then partial
// - Text query → fuzzy search across title + artist

export function search(query, library) {
  if (!query || !query.trim()) {
    return sortLibrary(library)
  }

  const q = query.trim()

  // If the library changed since last index, rebuild
  if (library !== indexedLibrary || !fuseInstance) {
    buildIndex(library)
  }

  // Pure number query: "142" → find by exact number first
  if (/^\d+$/.test(q)) {
    const exact = library.find(s => String(s.number) === q)
    if (exact) return [exact]
    // Partial number match
    const partial = library.filter(s => s.number && String(s.number).startsWith(q))
    if (partial.length) return partial
  }

  // Fuzzy text search
  const results = fuseInstance.search(q)
  return results.map(r => r.item)
}

// Sort: numbered songs first (ascending), then unnumbered (alphabetical by title)
function sortLibrary(library) {
  const numbered   = library.filter(s => s.number != null).sort((a, b) => Number(a.number) - Number(b.number))
  const unnumbered = library.filter(s => s.number == null).sort((a, b) => a.title.localeCompare(b.title))
  return [...numbered, ...unnumbered]
}

export { sortLibrary }
