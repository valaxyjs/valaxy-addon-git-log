import type { CommitInfo, ContributorInfo } from '@vueuse/metadata'

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
}

export interface Contributor extends ContributorInfo {
  name: string
  email: string
  avatar: string
  count: number
  github: string | null
}

export interface Changelog extends CommitInfo {

}

export interface GitLog {
  contributors: Contributor[]
  changeLog: Changelog[]
  path: string
}

export interface GitLogFileEntry {
  [path: string]: GitLog
}
