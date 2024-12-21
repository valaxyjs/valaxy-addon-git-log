import type { Plugin } from 'vite'
import process from 'node:process'
import { getChangeLog } from '../node/changeLog'
import { getContributors } from '../node/contributor'
import { ChangeLog } from './changelog'
import { Contributors } from './contributors'

// eslint-disable-next-line antfu/no-top-level-await
const [changeLog, contributions] = await Promise.all([
  getChangeLog(process.env.CI ? 1000 : 100),
  getContributors(),
])

export const GitLogVitePlugins: Plugin[] = [ChangeLog(changeLog), Contributors(contributions)]
