import { existsSync } from 'node:fs'
import { readFile, writeFile } from 'node:fs/promises'

type Database = {
  version: 1
  messageThreads: Map<string, string>
}

const createEmptyDatabase = (): Database => {
  return {
    version: 1,
    messageThreads: new Map<string, string>(),
  }
}

export const loadDatabase = async (databasePath: string): Promise<Database> => {
  // Create an empty database if one doesn't exist
  if (!existsSync(databasePath)) {
    await persistDatabase(createEmptyDatabase(), databasePath)
  }

  // Read and parse
  const contents = await readFile(databasePath)
  const reviver = (key: string, value: any) => {
    // Convert messageThreads back into a Map
    if (key === 'messageThreads') {
      return new Map(value)
    }
    return value
  }

  return JSON.parse(contents.toString(), reviver) as unknown as Database
}

export const persistDatabase = async (database: Database, databasePath: string): Promise<void> => {
  const replacer = (_: any, value: any) => {
    // Convert maps to array of arrays
    if (value instanceof Map) {
      return Array.from(value.entries())
    }
    return value
  }

  await writeFile(databasePath, JSON.stringify(database, replacer, 2))
}
