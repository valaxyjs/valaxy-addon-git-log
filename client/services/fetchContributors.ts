import type { Contributor } from '../../types'
import gravatar from 'gravatar'
import md5 from 'md5'

/**
 * Fetch contributors for a file path via the GitHub REST API.
 * Uses native `fetch` instead of @octokit/rest to keep the client bundle small.
 *
 * Note: Unauthenticated requests are limited to 60/hour per IP.
 */
export async function fetchContributors(owner: string, repo: string, path: string): Promise<Contributor[]> {
  let contributors: Contributor[] = []

  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/commits?path=${encodeURIComponent(path)}&per_page=100`
    const res = await fetch(url, {
      headers: { Accept: 'application/vnd.github.v3+json' },
    })

    if (!res.ok)
      throw new Error(`GitHub API responded with ${res.status} ${res.statusText} (${url})`)

    const data: Array<{
      author?: { login?: string, avatar_url?: string, name?: string, email?: string }
      commit: { author?: { name?: string, email?: string } }
    }> = await res.json()

    const contributorMap: Record<string, Contributor> = {}

    for (const { author, commit } of data) {
      const name = author?.name || author?.login || commit.author?.name || 'Unknown Contributor'
      const email = author?.email || commit.author?.email

      if (!email)
        continue

      const github = author?.login ? `https://github.com/${author.login}` : null
      const avatar = author?.avatar_url || `https:${gravatar.url(email, { d: 'wavatar' })}`
      const hash = md5(email)

      // Use email as key to avoid merging distinct contributors with the same name
      if (contributorMap[email])
        contributorMap[email].count += 1
      else
        contributorMap[email] = { count: 1, name, email, avatar, hash, github }
    }

    contributors = Object.values(contributorMap)

    // sort by commit count
    contributors.sort((a, b) => b.count - a.count)
  }
  catch (error) {
    console.error(`valaxy-addon-git-log: ${error}`)
  }

  return contributors
}
