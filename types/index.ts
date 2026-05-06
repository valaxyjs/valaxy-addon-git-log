export interface GitLogOptions {
  repositoryUrl?: string
  contributor?: {
    /**
     * @deprecated Use `strategy` instead
     */
    mode?: 'git' | 'api'
    /**
     * Data fetching strategy for contributor information
     * @default 'prebuilt'
     *
     * - 'prebuilt': Pre-generate during build (most compatible, works everywhere)
     * - 'build-time': Fetch during build process (may fail on restricted CI environments)
     * - 'runtime': Fetch at runtime via API (subject to rate limits but always fresh)
     */
    strategy?: 'prebuilt' | 'build-time' | 'runtime'
    /**
     * Additional arguments for git log command when strategy is 'git-log'
     * @example '--no-merges'
     */
    logArgs?: string
    /**
     * Whether to resolve GitHub usernames for contributors whose email
     * is not a GitHub noreply address.
     *
     * When enabled and `repositoryUrl` points to a GitHub repo, the addon
     * will call the GitHub API during build to look up contributor profiles.
     *
     * @default true
     */
    resolveGitHub?: boolean
  }
  changelog?: {
    /**
     * Commit types to include in changelog.
     * @default ['feat', 'fix']
     */
    includeTypes?: string[]
    /**
     * Whether to include commits with '!' (breaking changes).
     * @default true
     */
    includeBreaking?: boolean
    /**
     * Max number of commits to fetch per file.
     * @default 100 (1000 in CI)
     */
    maxCount?: number
  }
}

export interface Contributor {
  name: string
  email: string
  avatar: string
  count: number
  github: string | null
  hash: string
}

export interface Changelog {
  hash: string
  date: string
  /** Commit subject line (first line of commit message) */
  message: string
  refs?: string
  /**
   * Commit body (lines after the subject).
   * @deprecated Not reliably populated — git body can contain newlines that
   * conflict with `--name-only` output parsing. Use `message` for display.
   * Kept for backward compatibility; may be removed in a future major version.
   */
  body?: string
  author_name: string
  author_email: string
  version?: string
  functions?: string[]
}

export interface GitLog {
  contributors: Contributor[]
  changeLog: Changelog[]
  path: string
}

export interface GitLogFileEntry {
  [path: string]: GitLog
}

/**
 * Regex matching conventional commit breaking change marker in the header.
 * Matches: `type!:`, `type(scope)!:` patterns.
 */
const RE_BREAKING = /^\w+(?:\([^)]*\))?!:/

/**
 * Regex for matching conventional commit type token.
 * Matches: `type:`, `type(scope):`, `type!:`, `type(scope)!:`
 */
function matchesType(message: string, type: string): boolean {
  // Match `type:`, `type(`, or `type!:` — not just prefix
  return message.startsWith(`${type}:`)
    || message.startsWith(`${type}(`)
    || message.startsWith(`${type}!`)
}

/**
 * Shared filter for deciding which commits to include in changelog output.
 */
export function shouldIncludeCommit(message: string, options?: GitLogOptions['changelog']): boolean {
  const types = options?.includeTypes ?? ['feat', 'fix']
  const includeBreaking = options?.includeBreaking ?? true

  if (message.includes('chore: release'))
    return true
  if (includeBreaking && RE_BREAKING.test(message))
    return true
  return types.some(type => matchesType(message, type))
}
