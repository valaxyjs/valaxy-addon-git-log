import type { Contributor, GitLogOptions } from '../types'
import { execFileSync } from 'node:child_process'
import consola from 'consola'
import gravatar from 'gravatar'
import md5 from 'md5'
import { git } from '.'
import { guessGitHubUsername, parseGithubUrl, resolveGitHubUsers } from '../utils'

/**
 * Create a Contributor object from a name and email.
 * Shared by both single-file and batch contributor fetching.
 */
export function createContributor(name: string, email: string): Contributor {
  const githubUsername = guessGitHubUsername(email)
  const gravatarUrl = gravatar.url(email)
  return {
    count: 0,
    name,
    email,
    avatar: githubUsername
      ? `https://github.com/${githubUsername}.png`
      : gravatarUrl.startsWith('//') ? `https:${gravatarUrl}` : gravatarUrl,
    github: githubUsername ? `https://github.com/${githubUsername}` : null,
    hash: md5(email),
  }
}

/**
 * Resolve GitHub usernames for contributors that don't have one yet.
 * Uses the GitHub API to look up emails from the repository's commit history.
 *
 * **Note:** This function mutates the `contributors` array items in-place,
 * updating their `github` and `avatar` fields when a match is found.
 */
export async function resolveContributorsGitHub(
  contributors: Contributor[],
  repositoryUrl?: string,
): Promise<Contributor[]> {
  if (!repositoryUrl)
    return contributors

  const unresolved = contributors.filter(c => !c.github)
  if (!unresolved.length)
    return contributors

  let owner: string
  let repo: string
  try {
    ({ owner, repo } = parseGithubUrl(repositoryUrl))
  }
  catch {
    return contributors
  }

  const emailsToResolve = unresolved.map(c => c.email)
  const emailToLogin = await resolveGitHubUsers(owner, repo, emailsToResolve)

  for (const contributor of contributors) {
    if (contributor.github)
      continue

    const login = emailToLogin.get(contributor.email)
    if (login) {
      contributor.github = `https://github.com/${login}`
      contributor.avatar = `https://github.com/${login}.png`
    }
  }

  return contributors
}

/**
 * Deduplicate contributors: merge entries that share the same name
 * when at least one of them has a recognized GitHub noreply email,
 * so that e.g. "user@gmail.com" and "12345+user@users.noreply.github.com"
 * are merged into a single entry with GitHub avatar & link.
 */
export function deduplicateContributors(contributors: Contributor[]): Contributor[] {
  const merged: Contributor[] = []
  const consumed = new Set<number>()

  for (let i = 0; i < contributors.length; i++) {
    if (consumed.has(i))
      continue

    const base = { ...contributors[i] }
    for (let j = i + 1; j < contributors.length; j++) {
      if (consumed.has(j))
        continue

      const other = contributors[j]
      // Only merge when names match AND at least one side has GitHub info
      // (i.e. comes from a noreply email), to avoid false-positive merges
      if (base.name === other.name && (base.github || other.github)) {
        base.count += other.count
        if (!base.github && other.github) {
          base.github = other.github
          base.avatar = other.avatar
        }
        consumed.add(j)
      }
    }

    merged.push(base)
  }

  return merged
}

export async function getContributors(filePath?: string, options?: GitLogOptions): Promise<Contributor[]> {
  const { contributor } = options || {}

  try {
    const gitArgs: string[] = ['log', '--no-merges', '--pretty=format:%an|%ae']

    const additionalArgs: string[] = [
      filePath && `--`,
      filePath,
      contributor?.logArgs,
    ].filter((arg): arg is string => arg != null)

    const gitLog = await git.raw([...gitArgs, ...additionalArgs])

    const contributorsMap = gitLog
      .split('\n')
      .map(line => line.split('|') as [string, string])
      .filter(([_, email]) => email)
      .reduce((acc, [name, email]) => {
        if (!acc[email]) {
          acc[email] = createContributor(name, email)
        }
        acc[email].count++
        return acc
      }, {} as Record<string, Contributor>)

    const contributors = Object.values(contributorsMap)
    return deduplicateContributors(contributors).sort((a, b) => b.count - a.count)
  }
  catch (e) {
    consola.error('valaxy-addon-git-log: Error fetching contributors:', e)
    return []
  }
}

export function getLastUpdated(filePath: string) {
  const lastUpdated = execFileSync('git', ['log', '-1', '--format=%ct', '--', filePath], { encoding: 'utf-8' })
  return Number.parseInt(lastUpdated, 10) * 1000
}
