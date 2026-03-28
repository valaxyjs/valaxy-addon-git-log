import type { EditableTreeNode } from 'unplugin-vue-router'
import type { Changelog, Contributor, GitLogFileEntry, GitLogOptions } from '../types'
import path from 'node:path'
import process from 'node:process'
import consola from 'consola'
import gravatar from 'gravatar'
import md5 from 'md5'
import fs from 'fs-extra'
import { git } from '.'
import { guessGitHubUsername } from '../utils'

export const destDir = path.resolve(process.cwd(), './public')
// Only allow files from the user's working directory 'pages' folder
export const currentWorkingDirectory = `${process.cwd()}/pages`

/**
 * basePath is resolved asynchronously via `git revparse`. Store the promise
 * so that callers can `await` it instead of racing against `setBasePath`.
 */
let basePathPromise: Promise<string> | undefined
let basePath: string | undefined

export function initBasePath() {
  basePathPromise = git.revparse(['--show-toplevel']).then((result) => {
    basePath = result.trim()
    return basePath
  })
  return basePathPromise
}

export async function ensureBasePath(): Promise<string> {
  if (basePath)
    return basePath
  if (basePathPromise)
    return basePathPromise
  return initBasePath()
}

/** @deprecated Use ensureBasePath() instead */
export function setBasePath(p: string) {
  basePath = p
}

export function getBasePath() {
  return basePath
}

/**
 * Pending route info collected during extendRoute, processed in batch later.
 */
interface PendingRoute {
  route: EditableTreeNode
  filePath: string
  gitRelativePath: string
}

let pendingRoutes: PendingRoute[] = []

/**
 * Collect route info during extendRoute (fast, no git calls).
 * Actual git operations are deferred to `flushGitLogBatch`.
 */
export async function handleGitLogInfo(options: GitLogOptions, route: EditableTreeNode) {
  const strategy = options.contributor?.strategy
  const isPrebuilt = strategy === 'prebuilt'
  const isBuildTime = strategy === 'build-time'

  const filePath = route.components.get('default')
  if (!filePath)
    return

  if (!route.meta.frontmatter.git_log)
    route.meta.frontmatter.git_log = {}

  // Ensure basePath is available before computing relative path
  const resolvedBase = await ensureBasePath()

  const gitRelativePath = filePath.replace(resolvedBase, '').substring(1)
  route.meta.frontmatter.git_log.path = gitRelativePath

  if (!isPrebuilt && !isBuildTime)
    return

  if (!filePath.startsWith(currentWorkingDirectory))
    return

  pendingRoutes.push({ route, filePath, gitRelativePath })
}

/**
 * Batch-fetch contributors for all files in a single git command.
 * Returns a map of filePath -> Contributor[].
 */
async function batchGetContributors(resolvedBase: string, filePaths: string[], options?: GitLogOptions): Promise<Map<string, Contributor[]>> {
  const result = new Map<string, Contributor[]>()
  if (!filePaths.length)
    return result

  const { contributor } = options || {}

  try {
    const gitArgs = [
      'log',
      '--no-merges',
      '--pretty=format:---COMMIT_SEP---%an|%ae',
      '--name-only',
      ...(contributor?.logArgs ? [contributor.logArgs] : []),
      '--',
      ...filePaths,
    ]

    const raw = await git.raw(gitArgs)

    // Parse: each block is "---COMMIT_SEP---author|email\nfile1\nfile2\n..."
    const blocks = raw.split('---COMMIT_SEP---').filter(Boolean)

    // fileContribMap: filePath -> { email -> Contributor }
    const fileContribMap = new Map<string, Record<string, Contributor>>()

    for (const block of blocks) {
      const lines = block.trim().split('\n')
      if (!lines.length)
        continue

      const [name, email] = lines[0].split('|')
      if (!email)
        continue

      const files = lines.slice(1).filter(Boolean)
      for (const file of files) {
        // Resolve to absolute path for matching
        const absPath = path.resolve(resolvedBase, file)
        if (!fileContribMap.has(absPath))
          fileContribMap.set(absPath, {})

        const contribs = fileContribMap.get(absPath)!
        if (!contribs[email]) {
          const githubUsername = guessGitHubUsername(email)
          contribs[email] = {
            count: 0,
            name,
            email,
            avatar: githubUsername
              ? `https://github.com/${githubUsername}.png`
              : gravatar.url(email),
            github: githubUsername ? `https://github.com/${githubUsername}` : null,
            hash: md5(email),
          }
        }
        contribs[email].count++
      }
    }

    for (const [fp, contribs] of fileContribMap) {
      result.set(fp, Object.values(contribs).sort((a, b) => b.count - a.count))
    }
  }
  catch (e) {
    consola.error('valaxy-addon-git-log: Error batch-fetching contributors:', e)
  }

  return result
}

/**
 * Batch-fetch changelogs for all files in a single git command.
 * Returns a map of filePath -> Changelog[].
 */
async function batchGetChangelog(resolvedBase: string, filePaths: string[], maxCount: number): Promise<Map<string, Changelog[]>> {
  const result = new Map<string, Changelog[]>()
  if (!filePaths.length)
    return result

  try {
    const raw = await git.raw([
      'log',
      `--max-count=${maxCount}`,
      '--name-only',
      '--pretty=format:---CL_SEP---%H|%an|%ae|%aI|%s',
      '--',
      ...filePaths,
    ])

    const blocks = raw.split('---CL_SEP---').filter(Boolean)

    for (const block of blocks) {
      const lines = block.trim().split('\n')
      if (!lines.length)
        continue

      const headerLine = lines[0]
      const [hash, authorName, authorEmail, date, ...rest] = headerLine.split('|')
      const message = rest.join('|') || ''

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

      const files = lines.slice(1).filter(Boolean)
      for (const file of files) {
        const absPath = path.resolve(resolvedBase, file)
        if (!result.has(absPath))
          result.set(absPath, [])
        result.get(absPath)!.push(log)
      }
    }
  }
  catch (e) {
    consola.error('valaxy-addon-git-log: Error batch-fetching changelogs:', e)
  }

  return result
}

/**
 * Process all pending routes in batch: 2 git commands for ALL files
 * instead of 2 × N git commands (one per file).
 */
export async function flushGitLogBatch(options: GitLogOptions) {
  if (!pendingRoutes.length)
    return

  const routes = pendingRoutes
  pendingRoutes = []

  const strategy = options.contributor?.strategy
  const isPrebuilt = strategy === 'prebuilt'
  const isBuildTime = strategy === 'build-time'

  const resolvedBase = await ensureBasePath()

  const filePaths = routes.map(r => r.filePath)
  const maxCount = process.env.CI ? 1000 : 100

  // 2 git commands for ALL files (instead of 2 × N)
  const [contributorsMap, changelogMap] = await Promise.all([
    batchGetContributors(resolvedBase, filePaths, options),
    batchGetChangelog(resolvedBase, filePaths, maxCount),
  ])

  // Write results for prebuilt strategy (single file write)
  let prebuiltData: GitLogFileEntry = {}

  if (isPrebuilt && destDir) {
    const gitLogPath = path.join(destDir, 'git-log.json')
    try {
      if (await fs.pathExists(gitLogPath))
        prebuiltData = JSON.parse(await fs.readFile(gitLogPath, 'utf-8'))
    }
    catch (error) {
      consola.error('valaxy-addon-git-log: Error reading existing git log file:', error)
    }
  }

  for (const { route, filePath, gitRelativePath } of routes) {
    const contributors = contributorsMap.get(filePath) || []
    const changeLog = changelogMap.get(filePath) || []

    if (isBuildTime) {
      route.meta.frontmatter.git_log.contributors = contributors
      route.meta.frontmatter.git_log.changeLog = changeLog
    }

    if (isPrebuilt) {
      prebuiltData[gitRelativePath] = {
        contributors,
        changeLog,
        path: gitRelativePath,
      }
    }
  }

  if (isPrebuilt && destDir) {
    const gitLogPath = path.join(destDir, 'git-log.json')
    await fs.mkdir(path.dirname(gitLogPath), { recursive: true })
    await fs.writeFile(gitLogPath, JSON.stringify(prebuiltData, null, 2), 'utf-8')
  }
}
