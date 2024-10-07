import type { Ref } from 'vue'
import { computed, ref } from 'vue'
import { useFrontmatter } from 'valaxy'
import gravatar from 'gravatar'
import { isClient } from '@vueuse/core'
import { useAddonGitLogConfig } from '..'
import type { Contributor } from '../../types'

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
  fetch(`https://api.github.com/repos/${owner}/${repo}/commits?path=${path}`)
    .then((response) => {
      if (!response.ok)
        throw new Error(`Network response was not ok. Please check your repository and network connectivity.`)

      return response.json()
    })
    .then((commits) => {
      const contributorMap: { [key: string]: Contributor } = {}

      commits.forEach((commit: any) => {
        const name = commit.author.login
        const email = commit.commit.author.email
        const avatar = gravatar.url(email)

        if (contributorMap[name])
          contributorMap[name].count += 1
        else
          contributorMap[name] = { count: 1, name, email, avatar }
      })
      contributors.value = Object.values(contributorMap)

      // sort by commit count
      contributors.value.sort((a: any, b: any) => b.count - a.count)
    })
    .catch((error) => {
      console.error(`valaxy-addon-git-log: ${error}`)
    })

  return contributors
}
