import process from 'node:process'

// eslint-disable-next-line regexp/no-super-linear-backtracking
const RE_GITHUB_URL = /github\.com[/:](.+?)\/(.+?)(\.git)?$/
const RE_GITHUB_NOREPLY = /^(\d+\+)?([^@]+)@users\.noreply\.github\.com$/

/**
 * Read a GitHub token from the environment.
 *
 * Honors `GITHUB_TOKEN` (injected automatically into every GitHub Actions
 * workflow) and `GH_TOKEN` (the GitHub CLI convention). When present, API
 * requests are authenticated, lifting the rate limit from 60/hour (anonymous)
 * to 5000/hour — the standard way to avoid limits during docs builds.
 */
export function getGitHubToken(): string | undefined {
  return process.env.GITHUB_TOKEN || process.env.GH_TOKEN || undefined
}

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
 *
 * Unauthenticated requests are limited to 60/hour, so we keep the anonymous
 * cap low to avoid exhausting the quota during a single build. When a token
 * is present the limit jumps to 5000/hour, so we allow a much higher cap.
 */
const MAX_API_REQUESTS_ANON = 15
const MAX_API_REQUESTS_AUTH = 60

/**
 * Resolve GitHub usernames for a list of emails by querying the
 * repository's commit history via the GitHub REST API.
 *
 * This resolves emails that are NOT GitHub noreply addresses
 * (e.g. `me@yunyoujun.cn`) to the correct GitHub login by
 * checking the `author.login` field from the commits endpoint.
 *
 * Authenticates with a token from {@link getGitHubToken} when available
 * (5000 req/hour), falling back to unauthenticated requests (60 req/hour).
 * A per-call cap avoids quota exhaustion: {@link MAX_API_REQUESTS_ANON} when
 * anonymous, {@link MAX_API_REQUESTS_AUTH} when authenticated.
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

  const token = getGitHubToken()
  const MAX_API_REQUESTS = token ? MAX_API_REQUESTS_AUTH : MAX_API_REQUESTS_ANON

  try {
    const { Octokit } = await import('@octokit/rest')
    const octokit = new Octokit(token ? { auth: token } : {})

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
