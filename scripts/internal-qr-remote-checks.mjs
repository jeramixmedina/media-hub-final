import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { reducer, initialState } from '../src/context/appState.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')

function addSong(state, song) {
  return reducer(state, { type: 'ADD_TO_QUEUE', song })
}

function runQueueSimulation(commands, library) {
  let state = { ...initialState }
  for (const command of commands) {
    const song = library.find(item => item.id === command.songId)
    if (!song) {
      throw new Error(`Missing song in library for command songId="${command.songId}"`)
    }
    state = addSong(state, song)
  }
  return state.queue
}

async function assertRemoteScreenRoutes() {
  const remoteScreenPath = path.join(repoRoot, 'src/screens/RemoteScreen.jsx')
  const text = await fs.readFile(remoteScreenPath, 'utf8')

  assert.match(text, /generateQr\(`\$\{base\}\/songlist`/)
  assert.match(text, /generateQr\(`\$\{base\}\/remote`/)
  assert.match(text, /\{base\}\/songlist/)
  assert.match(text, /\{base\}\/remote/)
}

async function main() {
  const library = [
    { id: '1001', title: 'One', artist: 'A' },
    { id: '1002', title: 'Two', artist: 'B' },
    { id: '1003', title: 'Three', artist: 'C' },
  ]

  // Multiple simulated control points issuing queue commands.
  const remoteCommands = [
    { cp: 'cp-1', songId: '1001' },
    { cp: 'cp-2', songId: '1002' },
    { cp: 'cp-1', songId: '1003' },
    { cp: 'cp-2', songId: '1001' },
  ]

  await assertRemoteScreenRoutes()
  console.log('PASS: QR endpoints for song list and remote are present in RemoteScreen.')

  const queue = runQueueSimulation(remoteCommands, library)
  assert.deepEqual(queue.map(song => song.id), ['1001', '1002', '1003', '1001'])
  console.log('PASS: Queue order is stable for interleaved multi-control-point commands.')

  assert.equal(queue.length, remoteCommands.length)
  console.log('PASS: No dropped queue items in simulated remote command stream.')

  const uniqueCount = new Set(queue.map(song => song.id)).size
  if (uniqueCount !== queue.length) {
    console.warn('WARN: Duplicate queue entries are currently allowed (potential UX concern, not a regression).')
  } else {
    console.log('PASS: No duplicate queue entries detected.')
  }
}

main().catch(error => {
  console.error('FAIL:', error.message)
  process.exitCode = 1
})
