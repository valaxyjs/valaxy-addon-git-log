import { execSync } from 'node:child_process'
import gravatar from 'gravatar'
import { blue, dim, red, underline, yellow } from 'picocolors'
import consola from 'consola'
import type { Contributor } from '../types'

export function getContributors(filePath: string, tty: string | null) {
  const command = tty ? `git shortlog < ${tty} -s -n -e -c "${filePath}"` : `git shortlog -s -n -e -c "${filePath}"`
  const shortLog = execSync(command, { encoding: 'utf-8' })
  // const log = execSync(`git log --follow --no-merges --pretty=format:'{"name": "%an", "email": "%ae"}' ${filePath}`, { encoding: 'utf-8' })
  // const log = execSync(`git log --pretty=format:"%an" ${filePath} | sort | uniq -c | sort -k1,1nr`, { encoding: 'utf-8' })
  consola.info('shortLog', shortLog)
  const contributors = shortLog.split('\n')
    .filter(line => line.trim() !== '')
    .map((line) => {
      if (!line.trim())
        throw new Error(`${yellow('valaxy-addon-git-log')} - Encountered an empty line while parsing log for file: "${underline(filePath)}"`)

      const match = line.match(/^\s*(\d+)\s+(.+)\s<(.+)>$/)
      if (!match) {
        throw new Error(`${yellow('valaxy-addon-git-log')} - Failed to parse line: "${blue(line)}"\n`
          + ` ${dim('├─')} Error: Unable to match shortlog format\n`
          + ` ${dim('└─')} File: "${underline(filePath)}"`)
      }

      try {
      // const { name, email } = JSON.parse(line)
        const [, count, name, email] = match
        const avatar = gravatar.url(email)
        // return { name, email, avatar }
        return { count: Number.parseInt(count, 10), name, email, avatar }
      }
      catch (error) {
        throw new Error(
        `${yellow('valaxy-addon-git-log')} - Failed to parse line: "${blue(line)}"\n`
        + ` ${dim('├─')} Error: ${red(error as any)}\n`
        + ` ${dim('└─')} File: "${underline(filePath)}"`,
        )
      }
    })

  return contributors
}

export function getLastUpdated(filePath: string) {
  const lastUpdated = execSync(`git log -1 --format=%ct ${filePath}`, { encoding: 'utf-8' })
  return Number.parseInt(lastUpdated, 10) * 1000
}

export function countAndSortContributors(contributors: Array<{ name: string, email: string, avatar: string }>): Contributor[] {
  // Count the number of submissions per author
  const contributorCount = contributors.reduce((acc: { [key: string]: Contributor }, { name, email, avatar }) => {
    const key = `${name}|${email}`
    if (!acc[key])
      acc[key] = { name, email, avatar, count: 0 }

    acc[key].count += 1
    return acc
  }, {})

  // Sort by number of submissions
  return Object.values(contributorCount).sort((a, b) => b.count - a.count)
}
