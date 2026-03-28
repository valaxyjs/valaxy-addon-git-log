// eslint-disable-next-line regexp/no-super-linear-backtracking
const RE_GITHUB_URL = /github\.com[/:](.+?)\/(.+?)(\.git)?$/
const RE_GITHUB_NOREPLY = /^(\d+\+)?([^@]+)@users\.noreply\.github\.com$/

export function parseGithubUrl(url: string) {
  const match = url.match(RE_GITHUB_URL)

  if (!match)
    throw new Error('valaxy-addon-git-log: Invalid GitHub URL')

  const owner = match[1]
  const repo = match[2]

  return { owner, repo }
}

export function guessGitHubUsername(email: string): string | null {
  const match = email.match(RE_GITHUB_NOREPLY)
  return match ? match[2] : null
}

/**
 * Maximum number of GitHub API requests per `resolveGitHubUsers` invocation.
 * Unauthenticated requests are limited to 60/hour, so we cap total calls
 * to avoid exhausting the quota during a single build.
 */
const MAX_API_REQUESTS = 15

/**
 * Resolve GitHub usernames for a list of emails by querying the
 * repository's commit history via the GitHub REST API.
 *
 * This resolves emails that are NOT GitHub noreply addresses
 * (e.g. `me@yunyoujun.cn`) to the correct GitHub login by
 * checking the `author.login` field from the commits endpoint.
 *
 * Uses unauthenticated requests (60 req/hour) with a per-call cap
 * of {@link MAX_API_REQUESTS} requests to avoid quota exhaustion.
 */
export async function resolveGitHubUsers(
  owner: string,
  repo: string,
  emails: string[],
): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  if (!emails.length)
    return result

  // Deduplicate emails to minimize API calls
  const uniqueEmails = [...new Set(emails)]
  let requestCount = 0

  try {
    const { Octokit } = await import('@octokit/rest')
    const octokit = new Octokit()

    // --- Phase 1: fetch recent commits (up to 100) to build email -> login map ---
    const { data: commits } = await octokit.repos.listCommits({
      owner,
      repo,
      per_page: 100,
    })
    requestCount++

    for (const commit of commits) {
      const email = commit.commit.author?.email
      const login = commit.author?.login
      if (email && login && !result.has(email))
        result.set(email, login)
    }

    // --- Phase 2: paginate (page 2-3) for larger repos if emails remain ---
    if (commits.length >= 100) {
      for (const page of [2, 3]) {
        if (requestCount >= MAX_API_REQUESTS)
          break
        if (uniqueEmails.every(e => result.has(e)))
          break
        try {
          const { data } = await octokit.repos.listCommits({
            owner,
            repo,
            per_page: 100,
            page,
          })
          requestCount++
          for (const commit of data) {
            const email = commit.commit.author?.email
            const login = commit.author?.login
            if (email && login && !result.has(email))
              result.set(email, login)
          }
        }
        catch {
          break
        }
      }
    }

    // --- Phase 3: query by specific author email as last resort ---
    const stillUnresolved = uniqueEmails.filter(e => !result.has(e))
    for (const email of stillUnresolved) {
      if (requestCount >= MAX_API_REQUESTS)
        break
      try {
        const { data } = await octokit.repos.listCommits({
          owner,
          repo,
          author: email,
          per_page: 1,
        })
        requestCount++
        if (data.length && data[0].author?.login)
          result.set(email, data[0].author.login)
      }
      catch {
        // Rate limited or not found, skip
      }
    }
  }
  catch (error) {
    // Silently fail - GitHub resolution is best-effort
    console.warn('valaxy-addon-git-log: Failed to resolve GitHub usernames:', error)
  }

  return result
}
