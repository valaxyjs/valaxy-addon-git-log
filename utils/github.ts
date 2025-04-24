export function parseGithubUrl(url: string) {
  // eslint-disable-next-line regexp/no-super-linear-backtracking
  const match = url.match(/github\.com[/:](.+?)\/(.+?)(\.git)?$/)

  if (!match)
    throw new Error('valaxy-addon-git-log: Invalid GitHub URL')

  const owner = match[1]
  const repo = match[2]

  return { owner, repo }
}

export function guessGitHubUsername(email: string): string | null {
  const match = email.match(/^(\d+\+)?([^@]+)@users\.noreply\.github\.com$/)
  return match ? `https://github.com/${match[2]}` : null
}
