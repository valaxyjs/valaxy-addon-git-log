import process from 'node:process'
import { execSync } from 'node:child_process'
import { defineValaxyAddon } from 'valaxy'
import consola from 'consola'
import { blue, dim, underline, yellow } from 'picocolors'
import pkg from '../package.json'
import { getContributors } from '../utils'
import type { GitLogOptions } from '../types'

export const addonGitLog = defineValaxyAddon<GitLogOptions>(options => ({
  name: pkg.name,
  enable: true,
  options,

  setup(valaxy) {
    consola.info(`${yellow('valaxy-addon-git-log')}: ${blue('Platform')}: ${process.platform}`)
    let tty = process.platform === 'win32' ? 'CON' : '/dev/tty'
    if (process.platform === 'linux') {
      try {
        execSync(`test -e ${tty}`)
      }
      catch (error) {
        consola.warn(`${yellow('valaxy-addon-git-log')}: The path ${tty} does not exist`)
        tty = ''
      }
    }

    valaxy.hook('build:before', () => {
      try {
        consola.info(`${yellow('valaxy-addon-git-log')}: ${execSync('git --version')}`)
      }
      catch (error) {
        consola.error(`${yellow('valaxy-addon-git-log')} encountered an error: ${error}`)
      }
    })

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
          const contributors = getContributors(filePath, tty)
          debugInfo += ` ${dim('└─')} ${blue('Contributors')}: ${JSON.stringify(contributors)}\n`
          debugInfo += `${execSync(`git log --follow --no-merges -- ${filePath}`, { encoding: 'utf-8' })}`

          if (!route.meta.frontmatter.gitLogs)
            route.meta.frontmatter.gitLogContributors = []

          contributors.forEach((contributor) => {
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
