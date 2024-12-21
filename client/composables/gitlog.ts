import type { Ref } from 'vue'
import type { GitLog } from '../../types'
import { isClient } from '@vueuse/core'
import { useFrontmatter } from 'valaxy'
import { computed, toRef } from 'vue'

export function useGitLog(): Ref<GitLog> {
  const initGitLog: GitLog = {
    contributors: [],
    changeLog: [],
    path: '',
  }

  if (!isClient)
    return toRef(initGitLog)

  const frontmatter = useFrontmatter()

  const gitLog = computed<GitLog>(() => frontmatter.value.git_log || initGitLog)

  return gitLog
}
