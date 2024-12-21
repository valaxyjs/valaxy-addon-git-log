import type { Contributor } from '../../types'
import { Octokit } from '@octokit/rest'
import gravatar from 'gravatar'
import md5 from 'md5'

const octokit = new Octokit()

export async function fetchContributors(owner: string, repo: string, path: string): Promise<Contributor[]> {
  let contributors: Contributor[] = []

  try {
    const { data } = await octokit.repos.listCommits({ owner, repo, path })
    const contributorMap: { [key: string]: Contributor } = {}

    data.forEach(({ author, commit }) => {
      const name = author?.name || author?.login || commit.author?.name || 'Unknown Contributor'
      const email = author?.email || commit.author?.email

      if (!email)
        return

      const github = author?.login ? `https://github.com/${author?.login}` : null
      const avatar = author?.avatar_url || gravatar.url(email, { d: 'wavatar' })
      const hash = md5(email)

      if (contributorMap[name])
        contributorMap[name].count += 1
      else
        contributorMap[name] = { count: 1, name, email, avatar, hash, github }
    })

    contributors = Object.values(contributorMap)

    // sort by commit count
    contributors.sort((a, b) => b.count - a.count)
  }
  catch (error) {
    console.error(`valaxy-addon-git-log: ${error}`)
  }

  return contributors
}
