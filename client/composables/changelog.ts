import type { MaybeRefOrGetter, Ref } from 'vue'
import type { Changelog } from '../../types'
import { computedAsync } from '@vueuse/core'
import { computed } from 'vue'
import { useAddonGitLogConfig } from '../options'
import { useGitLog } from './gitlog'

export function useChangelog(_path?: MaybeRefOrGetter<string>): Ref<Changelog[]> {
  const gitLog = useGitLog()
  const gitLogOptions = useAddonGitLogConfig()

  if (gitLogOptions.value.contributor?.source !== 'runtime')
    return computed(() => gitLog.value.changeLog)

  const contributors = computedAsync<Changelog[]>(
    async () => {
      // TODO: Complete the API-based method
      return []
    },
    gitLog.value.changeLog,
    { lazy: true },
  )

  return contributors
}
