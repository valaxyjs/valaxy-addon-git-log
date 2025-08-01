import type { Contributor, GitLogOptions } from '../types'
import { execSync } from 'node:child_process'
import gravatar from 'gravatar'
import md5 from 'md5'
import { git } from '.'
import { guessGitHubUsername } from '../utils'

export async function getContributors(filePath?: string, options?: GitLogOptions): Promise<Contributor[]> {
  const { contributor } = options || {}

  try {
    const gitArgs: string[] = ['log', '--no-merges', '--pretty=format:"%an|%ae"']

    const additionalArgs: string[] = [
      filePath && `--`,
      filePath,
      contributor?.logArgs,
    ].filter((arg): arg is string => arg != null)

    const gitLog = await git.raw([...gitArgs, ...additionalArgs])

    const contributorsMap = gitLog
      .split('\n')
      .map(line => line.slice(1, -1).split('|') as [string, string])
      .filter(([_, email]) => email)
      .reduce((acc, [name, email]) => {
        if (!acc[email]) {
          const githubUsername = guessGitHubUsername(email)
          acc[email] = {
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
        acc[email].count++
        return acc
      }, {} as Record<string, Contributor>)

    return Object.values(contributorsMap).sort((a, b) => b.count - a.count)
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
