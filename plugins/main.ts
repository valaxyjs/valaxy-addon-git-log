import type { Plugin } from 'vite'
import process from 'node:process'
import { getChangelog } from '../node/changeLog'
import { getContributors } from '../node/contributor'
import { Changelog } from './changelog'
import { Contributors } from './contributors'

// eslint-disable-next-line antfu/no-top-level-await
const [changeLog, contributions] = await Promise.all([
  getChangelog(process.env.CI ? 1000 : 100),
  getContributors(),
])

export const GitLogVitePlugins: Plugin[] = [Changelog(changeLog), Contributors(contributions)]
