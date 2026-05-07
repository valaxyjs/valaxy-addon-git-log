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
 *
 * Uses O(n) grouping by name instead of O(n²) nested loops.
 */
export function deduplicateContributors(contributors: Contributor[]): Contributor[] {
  const byName = new Map<string, Contributor[]>()

  for (const c of contributors) {
    const group = byName.get(c.name)
    if (group)
      group.push(c)
    else
      byName.set(c.name, [c])
  }

  const merged: Contributor[] = []

  for (const group of byName.values()) {
    if (group.length === 1) {
      merged.push(group[0])
      continue
    }

    // Only merge when at least one entry has GitHub info
    const withGithub = group.filter(c => c.github)
    const withoutGithub = group.filter(c => !c.github)

    if (withGithub.length === 0) {
      // No github info — keep all separate (different people with same name)
      merged.push(...group)
      continue
    }

    // Merge all into the first github-having entry
    const base = { ...withGithub[0] }
    for (let i = 1; i < withGithub.length; i++)
      base.count += withGithub[i].count
    for (const c of withoutGithub)
      base.count += c.count
    merged.push(base)
  }

  return merged
}

export async function getContributors(filePath?: string, options?: GitLogOptions): Promise<Contributor[]> {
  const { contributor } = options || {}

  try {
    const gitArgs: string[] = ['log', '--no-merges', '--pretty=format:%an\x1F%ae']

    const additionalArgs: string[] = [
      filePath && `--`,
      filePath,
      contributor?.logArgs,
    ].filter((arg): arg is string => arg != null)

    const gitLog = await git.raw([...gitArgs, ...additionalArgs])

    const contributorsMap = gitLog
      .split('\n')
      .map(line => line.split('\x1F') as [string, string])
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

/**
 * Get the last updated timestamp of a file from git history (synchronous).
 * Kept synchronous for backward compatibility — consumers may call this in
 * sync contexts (e.g. Vite plugin transforms). Use {@link getLastUpdatedAsync}
 * in async pipelines to avoid blocking the event loop.
 */
export function getLastUpdated(filePath: string): number {
  const result = execFileSync('git', ['log', '-1', '--format=%ct', '--', filePath], { encoding: 'utf-8' })
  return Number.parseInt(result.trim(), 10) * 1000
}

/**
 * Async variant of {@link getLastUpdated}, using simple-git to avoid
 * blocking the event loop. Prefer this in async build pipelines.
 */
export async function getLastUpdatedAsync(filePath: string): Promise<number> {
  const result = await git.raw(['log', '-1', '--format=%ct', '--', filePath])
  return Number.parseInt(result.trim(), 10) * 1000
}
