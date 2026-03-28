import type { Plugin } from 'vite'
import type { Changelog as ChangelogType, Contributor } from '../types'
import process from 'node:process'
import { getChangelog } from '../node/changeLog'
import { getContributors } from '../node/contributor'

const CHANGELOG_ID = 'virtual:git-log/changelog'
const CONTRIBUTORS_ID = 'virtual:git-log/contributors'

/**
 * Defer heavy git operations to Vite's `configResolved` hook instead of
 * executing them at module top-level.
 *
 * Previously, `getChangelog()` and `getContributors()` ran as top-level await,
 * which blocked `jiti` / `define-config-ts` during `valaxy.config.ts` evaluation
 * (N+1 git subprocess calls took ~6 s on a typical repo).
 *
 * By moving the work into `configResolved`, the config file loads instantly and
 * the git I/O happens later — in parallel with other Vite initialisation.
 */
function LazyChangelog(): Plugin {
  let data: ChangelogType[] = []
  return {
    name: 'git-log-changelog',
    async configResolved() {
      data = await getChangelog(process.env.CI ? 1000 : 100)
    },
    resolveId(id) {
      return id === CHANGELOG_ID ? CHANGELOG_ID : null
    },
    load(id) {
      if (id !== CHANGELOG_ID)
        return null
      return `export default ${JSON.stringify(data)}`
    },
  }
}

function LazyContributors(): Plugin {
  let data: Contributor[] = []
  return {
    name: 'git-log-contributors',
    async configResolved() {
      data = await getContributors()
    },
    resolveId(id) {
      return id === CONTRIBUTORS_ID ? CONTRIBUTORS_ID : null
    },
    load(id) {
      if (id !== CONTRIBUTORS_ID)
        return null
      return `export default ${JSON.stringify(data)}`
    },
  }
}

export const GitLogVitePlugins: Plugin[] = [LazyChangelog(), LazyContributors()]
