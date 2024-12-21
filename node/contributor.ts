import type { Contributor, GitLogOptions } from '../types'
import { execSync } from 'node:child_process'
import gravatar from 'gravatar'
import md5 from 'md5'
import { git } from '.'

export async function getContributors(filePath?: string, options?: GitLogOptions): Promise<Contributor[]> {
  try {
    const gitArgs: string[] = ['log', '--no-merges', '--pretty=format:"%an|%ae"']

    const additionalArgs: string[] = [
      filePath ? '--' : null,
      filePath,
      options?.contributor?.logArgs,
    ].filter((arg): arg is string => arg != null)

    const gitLog = await git.raw(gitArgs.concat(additionalArgs))
    const list = gitLog.split('\n').map(i => i.slice(1, -1).split('|') as [string, string])

    const map: Record<string, Contributor> = {}

    list
      .filter(i => i[1])
      .forEach((i) => {
        if (!map[i[1]]) {
          map[i[1]] = {
            count: 0,
            name: i[0],
            email: i[1],
            avatar: gravatar.url(i[1]),
            github: null,
            hash: md5(i[1]),
          }
        }
        map[i[1]].count++
      })

    return Object.values(map).sort((a, b) => b.count - a.count)
  }
  catch (e) {
    console.error(e)
    return []
  }
}

export function getLastUpdated(filePath: string) {
  const lastUpdated = execSync(`git log -1 --format=%ct ${filePath}`, { encoding: 'utf-8' })
  return Number.parseInt(lastUpdated, 10) * 1000
}
