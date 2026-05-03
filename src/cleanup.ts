import { readdir, stat, rm } from 'node:fs/promises'
import { join } from 'node:path'

const DATA_DIR = process.env.DATA_DIR ?? 'data'
const SHOWCASE_SUBDIR = 'showcase-forms'
const RETENTION_MS = 30 * 24 * 60 * 60 * 1000
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000

export const cleanupOldSubmissions = async (): Promise<void> => {
  const root = join(DATA_DIR, SHOWCASE_SUBDIR)
  let entries
  try {
    entries = await readdir(root, { withFileTypes: true })
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return
    throw err
  }

  const cutoff = Date.now() - RETENTION_MS
  let removed = 0
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const path = join(root, entry.name)
    try {
      const s = await stat(path)
      if (s.mtimeMs < cutoff) {
        await rm(path, { recursive: true, force: true })
        removed++
      }
    } catch (err) {
      console.error('[cleanup] failed for', path, err)
    }
  }

  if (removed > 0) {
    console.log(`[cleanup] removed ${removed} submission(s) older than 30 days`)
  }
}

export const startCleanupScheduler = (): void => {
  void cleanupOldSubmissions().catch((err) => console.error('[cleanup] initial run failed', err))
  setInterval(() => {
    void cleanupOldSubmissions().catch((err) => console.error('[cleanup] scheduled run failed', err))
  }, CLEANUP_INTERVAL_MS).unref()
}
