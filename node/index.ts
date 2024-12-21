import type { GitLogOptions } from '../types'
import process from 'node:process'
import consola from 'consola'
import Git from 'simple-git'
import { defineValaxyAddon } from 'valaxy'
import pkg from '../package.json'
import { getChangeLog } from './changeLog'
import { getContributors } from './contributor'

export const git = Git({
  maxConcurrentProcesses: 200,
})

export const addonGitLog = defineValaxyAddon<GitLogOptions>(options => ({
  name: pkg.name,
  enable: true,
  options: {
    ...options,
    contributor: {
      mode: 'api',
    },
  },

  async setup(valaxy) {
    const basePath = await git.revparse(['--show-toplevel'])

    valaxy.hook('vue-router:extendRoute', async (route) => {
      const filePath = route.components.get('default') as string

      if (filePath) {
        if (!route.meta.frontmatter.git_log)
          route.meta.frontmatter.git_log = {}

        const gitRelativePath = filePath.replace(basePath, '').substring(1)
        route.meta.frontmatter.git_log.path = gitRelativePath

        // Only allow files from the user's working directory 'pages' folder
        const currentWorkingDirectory = `${process.cwd()}/pages`
        if (!filePath.startsWith(currentWorkingDirectory))
          return

        if (options?.contributor?.mode === 'log') {
          try {
            const contributors = await getContributors(filePath, options)
            route.meta.frontmatter.git_log.contributors = contributors

            const changeLog = await getChangeLog(process.env.CI ? 1000 : 100, filePath)
            route.meta.frontmatter.git_log.changeLog = changeLog
          }
          catch (error) {
            consola.error(error)
          }
        }
      }
    })
  },
}))
