import { computed } from 'vue'
import type { ValaxyAddon } from 'valaxy'
import { useRuntimeConfig } from 'valaxy'
import type { GitLogOptions } from '../types'

/**
 * get addon config
 */
export function useAddonGitLog() {
  const runtimeConfig = useRuntimeConfig()
  return computed<GitLogOptions>(() => {
    const options = (runtimeConfig.value.addons['valaxy-addon-git-log'] as ValaxyAddon<GitLogOptions>).options

    return {
      ...options,
      // eslint-disable-next-line node/prefer-global/process
      debug: options?.debug as boolean ?? process.env.DEBUG,
    }
  })
}
