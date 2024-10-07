import type { Ref } from 'vue'
import { computed, ref } from 'vue'
import { useFrontmatter } from 'valaxy'
import gravatar from 'gravatar'
import { isClient } from '@vueuse/core'
import { Octokit } from '@octokit/rest'
import { useAddonGitLogConfig } from '..'
import type { Contributor } from '../../types'

const octokit = new Octokit()
export function useAddonGitLogContributor() {
  if (!isClient)
    return

  const frontmatter = useFrontmatter()
  const gitLogOptions = useAddonGitLogConfig()

  const gitLog = computed(() => frontmatter.value.git_log || {
    contributors: [],
  })

  const contributors: Ref<Contributor[]> = ref(gitLog.value.contributors)

  if (gitLogOptions.value.contributor?.mode !== 'api')
    return

  // eslint-disable-next-line regexp/no-super-linear-backtracking
  const match = gitLogOptions.value.repositoryUrl!.match(/github\.com[/:](.+?)\/(.+?)(\.git)?$/)

  if (!match)
    throw new Error('valaxy-addon-git-log: Invalid GitHub URL')

  const owner = match[1]
  const repo = match[2]
  const path = gitLog.value.path

  fetchCommits(owner, repo, path).then((commits) => {
    contributors.value = commits
  })

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
