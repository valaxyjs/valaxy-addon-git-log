import { computed } from 'vue'
import type { ValaxyAddon } from 'valaxy'
import { useRuntimeConfig } from 'valaxy'
import type { GitLogOptions } from '../types'

export function useAddonGitLog() {
  const runtimeConfig = useRuntimeConfig()
  return computed<GitLogOptions>(() => {
    const options = (runtimeConfig.value.addons['valaxy-addon-git-log'] as ValaxyAddon<GitLogOptions>).options

    return {
      ...options,
      contributor: {
        mode: 'api',
      },
    }
  })
}
