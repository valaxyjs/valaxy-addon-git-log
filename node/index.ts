import type { GitLogOptions } from '../types'
import consola from 'consola'
import defu from 'defu'
import Git from 'simple-git'
import { defineValaxyAddon } from 'valaxy'
import pkg from '../package.json'
import { handleGitLogInfo, setBasePath } from './gitLog'

export const git = Git({
  maxConcurrentProcesses: 200,
})

export const addonGitLog = defineValaxyAddon<GitLogOptions>(options => ({
  name: pkg.name,
  enable: true,
  options: defu(
    options,
    {
      contributor: {
        source: options?.contributor?.mode === 'api'
          ? 'runtime'
          : options?.contributor?.mode === 'git' ? 'build-time' : 'prebuilt',
      },
    },
  ),

  setup(valaxy) {
    if (options?.contributor?.mode)
      consola.warn('valaxy-addon-git-log: contributor.mode is deprecated. Please use contributor.source instead.')

    git.revparse(['--show-toplevel'])
      .then((result) => {
        const basePath = result.trim()
        setBasePath(basePath)
      })
      .catch((error) => {
        consola.error('valaxy-addon-git-log: Error getting git root directory:', error)
      })

    valaxy.hook('vue-router:extendRoute', async (route) => {
      await handleGitLogInfo(options || {}, route)
    })
  },
}))
