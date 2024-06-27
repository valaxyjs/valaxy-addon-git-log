import process from 'node:process'
import { defineValaxyAddon } from 'valaxy'
import consola from 'consola'
import { blue, dim, underline, yellow } from 'picocolors'
import pkg from '../package.json'
import { countAndSortContributors, getContributors } from '../utils'
import type { GitLogOptions } from '../types'

export const addonGitLog = defineValaxyAddon<GitLogOptions>(options => ({
  name: pkg.name,
  enable: true,
  options,

  setup(valaxy) {
    valaxy.hook('vue-router:extendRoute', async (route) => {
      const filePath = route.components.get('default') as string
      if (filePath) {
        // Only allow files from the user's working directory 'pages' folder
        const currentWorkingDirectory = `${process.cwd()}/pages`
        if (!filePath.startsWith(currentWorkingDirectory))
          return

        let debugInfo = `${yellow('valaxy-addon-git-log(debug):\n')}`

        debugInfo += ` ${dim('├─')} ${blue('FilePath')}: ${underline(filePath)}\n`

        try {
          const contributors = getContributors(filePath)
          debugInfo += ` ${dim('├─')} ${blue('Contributors')}: ${JSON.stringify(contributors)}\n`
          const sortedContributors = countAndSortContributors(contributors)
          debugInfo += ` ${dim('└─')} ${blue('SortedContributors')}: ${JSON.stringify(sortedContributors)}`

          if (!route.meta.frontmatter.gitLogs)
            route.meta.frontmatter.gitLogContributors = []

          sortedContributors.forEach((contributor) => {
            route.meta.frontmatter.gitLogContributors.push(contributor)
          })

          // Output debug information based on configuration or environment variables
          if (options?.debug !== false)
            (options?.debug ? consola.info : consola.debug)(debugInfo)
        }
        catch (error) {
          consola.error(error)
        }
      }
    })
  },
}))
