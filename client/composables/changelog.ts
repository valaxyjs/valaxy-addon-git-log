import type { MaybeRefOrGetter, Ref } from 'vue'
import type { Changelog } from '../../types'
import { computedAsync } from '@vueuse/core'
import { computed } from 'vue'
import { useAddonGitLogConfig } from '../options'
import { useGitLog } from './gitlog'

export function useChangelog(_path?: MaybeRefOrGetter<string>): Ref<Changelog[]> {
  const gitLog = useGitLog()
  const gitLogOptions = useAddonGitLogConfig()
  const strategy = gitLogOptions.value.contributor?.strategy

  if (strategy === 'runtime') {
    const changelog = computedAsync<Changelog[]>(
      async () => {
        // Runtime changelog is not yet supported via GitHub API
        // (GitHub commits endpoint doesn't provide conventional-commit filtering)
        // Fall back to empty — consumers should prefer 'prebuilt' or 'build-time'
        return []
      },
      gitLog.value.changeLog,
      { lazy: true },
    )

    return changelog
  }

  return computed(() => gitLog.value.changeLog)
}
