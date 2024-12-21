import type { MaybeRefOrGetter, Ref } from 'vue'
import type { ChangeLog } from '../../types'
import { computedAsync } from '@vueuse/core'
import { computed } from 'vue'
import { useAddonGitLogConfig } from '../options'
import { useGitLog } from './gitlog'

export function useChangeLog(_path?: MaybeRefOrGetter<string>): Ref<ChangeLog[]> {
  const gitLog = useGitLog()
  const gitLogOptions = useAddonGitLogConfig()

  if (gitLogOptions.value.contributor?.mode !== 'api')
    return computed(() => gitLog.value.changeLog)

  const contributors = computedAsync<ChangeLog[]>(
    async () => {
      // TODO: Complete the API-based method
      return []
    },
    gitLog.value.changeLog,
    { lazy: true },
  )

  return contributors
}
