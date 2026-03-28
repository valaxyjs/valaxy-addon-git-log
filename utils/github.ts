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
