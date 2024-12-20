import type { MaybeRefOrGetter } from 'vue'
import type { Contributor } from '../../types'
import { Octokit } from '@octokit/rest'
import { computedAsync, isClient } from '@vueuse/core'
import gravatar from 'gravatar'
import { useFrontmatter } from 'valaxy'
import { computed, toValue } from 'vue'
import { useAddonGitLogConfig } from '..'
import { parseGithubUrl } from '../../utils'

const octokit = new Octokit()
export function useAddonGitLogContributor(userPath?: MaybeRefOrGetter<string>) {
  if (!isClient)
    return

  const frontmatter = useFrontmatter()
  const gitLogOptions = useAddonGitLogConfig()

  const gitLog = computed(() => frontmatter.value.git_log || {
    contributors: [],
  })

  if (gitLogOptions.value.contributor?.mode !== 'api')
    return

  const { owner, repo } = parseGithubUrl(gitLogOptions.value.repositoryUrl!)

  const autoPath = gitLog.value.path

  const contributors = computedAsync<Contributor[]>(
    async () => {
      const path = toValue(userPath || autoPath)
      return await fetchCommits(owner, repo, path)
    },
    gitLog.value.contributors,
    { lazy: true },
  )

  return contributors
}

async function fetchCommits(owner: string, repo: string, path: string): Promise<Contributor[]> {
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

      if (contributorMap[name])
        contributorMap[name].count += 1
      else
        contributorMap[name] = { count: 1, name, email, avatar, github }
    })

    contributors = Object.values(contributorMap)

    // sort by commit count
    contributors.sort((a: any, b: any) => b.count - a.count)
  }
  catch (error) {
    console.error(`valaxy-addon-git-log: ${error}`)
  }

  return contributors
}
