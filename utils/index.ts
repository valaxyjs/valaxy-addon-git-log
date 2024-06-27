import { execSync } from 'node:child_process'
import gravatar from 'gravatar'
import type { Contributor } from '../types'

export function getContributors(filePath: string) {
  const log = execSync(`git log --pretty=format:"%an|%ae" ${filePath}`, { encoding: 'utf-8' })
  const contributors = log.split('\n').map((line) => {
    const [name, email] = line.split('|')
    const avatar = gravatar.url(email)
    return { name, email, avatar }
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
