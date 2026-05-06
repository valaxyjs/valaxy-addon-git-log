import type { Changelog, GitLogOptions } from '../types'
import process from 'node:process'
import { git } from '.'
import { shouldIncludeCommit } from '../types'

/**
 * ASCII Unit Separator — used as field delimiter in git pretty formats.
 */
const FIELD_SEP = '\x1F'

let cache: Changelog[] | undefined

const RE_BACKSLASH = /\\/g
const RE_PACKAGE_PATH = /^packages\/\w+\/(\w+)\/\w+\.ts$/

/**
 * Separator used to split combined git log output into per-commit blocks.
 */
const COMMIT_SEP = '---COMMIT_SEP---'

export async function getChangelog(maxCount = 200, path?: string, options?: GitLogOptions) {
  // Only use cache in CI/production — in dev mode always fetch fresh data
  if (cache && process.env.CI)
    return cache

  // Fetch commits together with their changed files in a single git call.
  const raw = await git.raw([
    'log',
    `--max-count=${maxCount}`,
    '--name-only',
    `--pretty=format:${COMMIT_SEP}%n%H${FIELD_SEP}%an${FIELD_SEP}%ae${FIELD_SEP}%aI${FIELD_SEP}%s`,
    ...(path ? ['--', path] : []),
  ])

  const blocks = raw.split(COMMIT_SEP).filter(Boolean)

  const logs: Changelog[] = []

  for (const block of blocks) {
    const lines = block.trim().split('\n')
    if (!lines.length)
      continue

    const headerLine = lines[0]
    const [hash, authorName, authorEmail, date, ...rest] = headerLine.split(FIELD_SEP)
    const message = rest.join(FIELD_SEP) || ''

    // Apply configurable filter
    if (!shouldIncludeCommit(message, options?.changelog))
      continue

    const log: Changelog = {
      hash,
      date,
      message,
      refs: '',
      author_name: authorName,
      author_email: authorEmail,
    }

    if (message.includes('chore: release')) {
      log.version = message.split(' ')[2]?.trim()
    }
    else {
      // Changed files are on the remaining non-empty lines
      const files = lines.slice(1).filter(Boolean).map(f => f.replace(RE_BACKSLASH, '/'))
      log.functions = files
        .map(i => i.match(RE_PACKAGE_PATH)?.[1])
        .filter((v): v is string => Boolean(v))
        .filter((v, i, arr) => arr.indexOf(v) === i)
    }

    logs.push(log)
  }

  cache = logs
  return logs
}
