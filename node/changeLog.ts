import type { Changelog } from '../types'
import { uniq } from '@vueuse/metadata'
import { git } from '.'

let cache: Changelog[] | undefined

/**
 * Separator used to split combined git log output into per-commit blocks.
 */
const COMMIT_SEP = '---COMMIT_SEP---'

export async function getChangelog(maxCount = 200, path?: string) {
  if (cache)
    return cache

  // Fetch commits together with their changed files in a single git call.
  // This replaces the previous N+1 pattern (1 `git log` + N `git diff-tree`)
  // that spawned ~100 sub-processes and took ~6 s.
  const raw = await git.raw([
    'log',
    `--max-count=${maxCount}`,
    '--name-only',
    `--pretty=format:${COMMIT_SEP}%n%H|%an|%ae|%aI|%s|%b`,
    ...(path ? ['--', path] : []),
  ])

  const blocks = raw.split(COMMIT_SEP).filter(Boolean)

  const logs: Changelog[] = []

  for (const block of blocks) {
    const lines = block.trim().split('\n')
    if (!lines.length)
      continue

    const headerLine = lines[0]
    const [hash, authorName, authorEmail, date, ...rest] = headerLine.split('|')
    const messageParts = rest.join('|')
    // The pretty format puts subject|body — split on first occurrence
    const message = messageParts || ''

    // Apply the same filter as before
    if (
      !message.includes('chore: release')
      && !message.includes('!')
      && !message.startsWith('feat')
      && !message.startsWith('fix')
    ) {
      continue
    }

    const log: Changelog = {
      hash,
      date,
      message,
      refs: '',
      author_name: authorName,
      author_email: authorEmail,
    } as Changelog

    if (message.includes('chore: release')) {
      log.version = message.split(' ')[2]?.trim()
    }
    else {
      // Changed files are on the remaining non-empty lines
      const files = lines.slice(1).filter(Boolean).map(f => f.replace(/\\/g, '/'))
      log.functions = uniq(
        files
          .map(i => i.match(/^packages\/\w+\/(\w+)\/\w+\.ts$/)?.[1])
          .filter(Boolean),
      )
    }

    logs.push(log)
  }

  return cache = logs
}
