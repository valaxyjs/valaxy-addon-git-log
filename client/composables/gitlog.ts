import type { Ref } from 'vue'
import type { GitLog, GitLogFileEntry } from '../../types'
import { isClient } from '@vueuse/core'
import { useFrontmatter } from 'valaxy'
import { computed, ref, toRef } from 'vue'
import { useAddonGitLogConfig } from '../options'

export function useGitLog(): Ref<GitLog> {
  const initGitLog: GitLog = {
    contributors: [],
    changeLog: [],
    path: '',
  }

  if (!isClient)
    return toRef(initGitLog)

  const frontmatter = useFrontmatter<{ git_log: GitLog }>()
  const gitLogOptions = useAddonGitLogConfig()
  const gitLogData = ref<GitLog>(initGitLog)

  const source = gitLogOptions.value.contributor?.source
  const isPrebuilt = source === 'prebuilt'
  const path = frontmatter.value.git_log?.path

  if (isPrebuilt && path) {
    fetch('/git-log.json')
      .then(res => res.json())
      .then((data: GitLogFileEntry) => {
        if (data[path])
          gitLogData.value = data[path]
      })
      .catch(error => console.error('valaxy-addon-git-log: Error fetching git-log.json:', error))
  }

  const gitLog = computed<GitLog>(() => {
    if (isPrebuilt)
      return gitLogData.value
    return frontmatter.value.git_log || initGitLog
  })

  return gitLog
}
