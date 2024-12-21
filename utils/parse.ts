export function parseGithubUrl(url: string) {
  // eslint-disable-next-line regexp/no-super-linear-backtracking
  const match = url.match(/github\.com[/:](.+?)\/(.+?)(\.git)?$/)

  if (!match)
    throw new Error('valaxy-addon-git-log: Invalid GitHub URL')

  const owner = match[1]
  const repo = match[2]

  return { owner, repo }
}
