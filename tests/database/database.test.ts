import { afterAll, beforeAll, expect, it } from '@jest/globals'
import { mkdtempSync } from 'fs'
import { existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { loadDatabase, persistDatabase } from '../../src/database/database'

let tmpDir: string

beforeAll(() => {
  // Create temporary directory to hold our test database
  tmpDir = mkdtempSync(join(tmpdir(), 'umm-bot-tests'))
})

afterAll(() => {
  // Remove our temporary directory
  rmSync(tmpDir, { recursive: true })
})

it('can be persisted, loaded, manipulated, persisted and loaded properly', async () => {
  const databasePath = join(tmpDir, 'umm-bot-test-database.json')

  // Load the database. Since it doesn't exist at this point, an empty one should be created
  const database = await loadDatabase(databasePath)
  expect(existsSync(databasePath)).toEqual(true)
  expect(database.version).toEqual(1)
  expect(database.messageThreads.size).toEqual(0)

  // Add some data and persist the database
  database.messageThreads.set('foo', 'bar')
  database.messageThreads.set('foo2', 'bar2')

  await persistDatabase(database, databasePath)

  // Load the database again, verify it was actually persisted
  const database2 = await loadDatabase(databasePath)
  expect(database2.messageThreads.size).toEqual(2)
  expect(database2.messageThreads.get('foo')).toEqual('bar')
  expect(database2.messageThreads.get('foo2')).toEqual('bar2')
})
