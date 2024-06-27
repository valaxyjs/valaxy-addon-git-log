import { execSync } from 'node:child_process'
import gravatar from 'gravatar'
import { blue, dim, red, underline, yellow } from 'picocolors'
import type { Contributor } from '../types'

export function getContributors(filePath: string) {
  const log = execSync(`git log --pretty=format:'{"name": "%an", "email": "%ae"}' ${filePath}`, { encoding: 'utf-8' })
  const contributors = log.split('\n').map((line) => {
    if (!line.trim())
      throw new Error(`${yellow('valaxy-addon-git-log')} - Encountered an empty line while parsing log for file: "${underline(filePath)}"`)

    try {
      const { name, email } = JSON.parse(line)
      const avatar = gravatar.url(email)
      return { name, email, avatar }
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
