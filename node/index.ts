import type { GitLogOptions } from '../types'
import consola from 'consola'
import defu from 'defu'
import Git from 'simple-git'
import { defineValaxyAddon } from 'valaxy'
import pkg from '../package.json'
import { flushGitLogBatch, handleGitLogInfo, initBasePath } from './gitLog'

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
        strategy: options?.contributor?.mode === 'api'
          ? 'runtime'
          : options?.contributor?.mode === 'git' ? 'build-time' : 'prebuilt',
      },
    },
  ),

  setup(valaxy) {
    if (options?.contributor?.mode)
      consola.warn('valaxy-addon-git-log: contributor.mode is deprecated. Please use contributor.strategy instead.')

    // Start resolving basePath early; callers use ensureBasePath() to await it
    // Start resolving basePath early; ensureBasePath() handles failures internally
    initBasePath()

    // Phase 1: collect routes (no git calls, instant)
    valaxy.hook('vue-router:extendRoute', async (route) => {
      await handleGitLogInfo(options || {}, route)
    })

    // Phase 2: batch-process all collected routes (2 git calls total)
    valaxy.hook('vue-router:beforeWriteFiles', async () => {
      await flushGitLogBatch(options || {})
    })
  },
}))
