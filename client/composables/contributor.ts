import type { MaybeRefOrGetter, Ref } from 'vue'
import type { Contributor } from '../../types'
import { computedAsync } from '@vueuse/core'
import { toRef, toValue } from 'vue'
import { parseGithubUrl } from '../../utils'
import { useAddonGitLogConfig } from '../options'
import { fetchContributors } from '../services'
import { useGitLog } from './gitlog'

export function useContributor(path?: MaybeRefOrGetter<string>): Ref<Contributor[]> {
  const gitLog = useGitLog()
  const gitLogOptions = useAddonGitLogConfig()

  if (gitLogOptions.value.contributor?.mode !== 'api')
    return toRef([])

  const contributors = computedAsync<Contributor[]>(
    async () => {
      const { owner, repo } = parseGithubUrl(gitLogOptions.value.repositoryUrl!)
      const _path = toValue(path || gitLog.value.path)
      return await fetchContributors(owner, repo, _path)
    },
    gitLog.value.contributors,
    { lazy: true },
  )

  return contributors
}
