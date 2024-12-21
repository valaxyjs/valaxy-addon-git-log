import type { ValaxyAddon } from 'valaxy'
import type { GitLogOptions } from '../types'
import { useRuntimeConfig } from 'valaxy'
import { computed } from 'vue'

export function useAddonGitLogConfig() {
  const runtimeConfig = useRuntimeConfig()
  return computed<GitLogOptions>(() => {
    const options = (runtimeConfig.value.addons['valaxy-addon-git-log'] as ValaxyAddon<GitLogOptions>).options

    return { ...options }
  })
}
