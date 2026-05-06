import type { Ref } from 'vue'
import type { GitLog, GitLogFileEntry } from '../../types'
import { isClient } from '@vueuse/core'
import { useFrontmatter } from 'valaxy'
import { computed, ref, toRef } from 'vue'
import { useAddonGitLogConfig } from '../options'

/**
 * Module-level cache to avoid re-fetching git-log.json on every route navigation.
 */
let cachedData: GitLogFileEntry | null = null
let fetchPromise: Promise<GitLogFileEntry> | null = null

function getGitLogData(): Promise<GitLogFileEntry> {
  if (cachedData)
    return Promise.resolve(cachedData)
  if (!fetchPromise) {
    const base = import.meta.env.BASE_URL || '/'
    const url = `${base}git-log.json`
    fetchPromise = fetch(url)
      .then((res) => {
        if (!res.ok)
          throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`)
        return res.json()
      })
      .then((data: GitLogFileEntry) => {
        cachedData = data
        return data
      })
      .catch((err) => {
        // Allow retry on next call
        fetchPromise = null
        throw err
      })
  }
  return fetchPromise
}

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

  const strategy = gitLogOptions.value.contributor?.strategy
  const isPrebuilt = strategy === 'prebuilt'
  const path = frontmatter.value.git_log?.path

  if (isPrebuilt && path) {
    getGitLogData()
      .then((data) => {
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

/**
 * Extended version of useGitLog that also exposes loading and error state.
 */
export function useGitLogState() {
  const initGitLog: GitLog = {
    contributors: [],
    changeLog: [],
    path: '',
  }

  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  if (!isClient) {
    return {
      data: toRef(initGitLog),
      isLoading,
      error,
    }
  }

  const frontmatter = useFrontmatter<{ git_log: GitLog }>()
  const gitLogOptions = useAddonGitLogConfig()
  const gitLogData = ref<GitLog>(initGitLog)

  const strategy = gitLogOptions.value.contributor?.strategy
  const isPrebuilt = strategy === 'prebuilt'
  const path = frontmatter.value.git_log?.path

  if (isPrebuilt && path) {
    isLoading.value = true
    getGitLogData()
      .then((data) => {
        if (data[path])
          gitLogData.value = data[path]
      })
      .catch((e) => {
        error.value = e
      })
      .finally(() => {
        isLoading.value = false
      })
  }

  const data = computed<GitLog>(() => {
    if (isPrebuilt)
      return gitLogData.value
    return frontmatter.value.git_log || initGitLog
  })

  return { data, isLoading, error }
}
