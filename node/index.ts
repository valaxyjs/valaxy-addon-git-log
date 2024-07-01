import process from 'node:process'
import { execSync } from 'node:child_process'
import { defineValaxyAddon } from 'valaxy'
import consola from 'consola'
import { blue, bold, dim, green, magenta, underline, yellow } from 'picocolors'
import pkg from '../package.json'
import type { GitLogOptions } from '../types'
import { getContributors } from './contributor'

export const addonGitLog = defineValaxyAddon<GitLogOptions>(options => ({
  name: pkg.name,
  enable: true,
  options,

  setup(valaxy) {
    const _options = {
      contributor: {
        mode: options!.contributor?.mode || 'api',
        logArgs: options!.contributor?.logArgs || '',
      },
    }

    const tty = process.platform === 'win32' ? 'CON' : '/dev/tty'
    const basePath = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim()

    valaxy.hook('build:before', () => {
      try {
        if (!options?.debug)
          return
        consola.info(`${yellow('valaxy-addon-git-log')}: ${blue('Platform')}: ${process.platform}`)
        consola.info(`${yellow('valaxy-addon-git-log')}: ${execSync('git --version')}`)
        consola.info(execSync(
          `git log --no-merges --max-count=30 --pretty="format:${dim(green('%ar'))} ${bold(magenta('%h'))} ${bold(green('%an'))} ${bold(yellow('%s'))}"`,
          { encoding: 'utf-8' },
        ))
      }
      catch (error) {
        consola.error(`${yellow('valaxy-addon-git-log')} encountered an error: ${error}`)
      }
    })

    valaxy.hook('vue-router:extendRoute', async (route) => {
      const filePath = route.components.get('default') as string
      if (filePath) {
        if (!route.meta.frontmatter.git_log)
          route.meta.frontmatter.git_log = {}

        if (!route.meta.frontmatter.git_log.path)
          route.meta.frontmatter.git_log.path = []

        const gitRelativePath = filePath.replace(basePath, '').substring(1)
        route.meta.frontmatter.git_log.path = gitRelativePath

        if (_options.contributor.mode === 'api')
          return

        // Only allow files from the user's working directory 'pages' folder
        const currentWorkingDirectory = `${process.cwd()}/pages`
        if (!filePath.startsWith(currentWorkingDirectory))
          return

        let debugInfo = `${yellow('valaxy-addon-git-log(debug):\n')}`

        debugInfo += ` ${dim('├─')} ${blue('FilePath')}: ${underline(filePath)}\n`

        try {
          const contributors = getContributors(filePath, tty, _options)
          debugInfo += ` ${dim('└─')} ${blue('Contributors')}: ${JSON.stringify(contributors)}\n`

          if (!route.meta.frontmatter.gitLogs)
            route.meta.frontmatter.git_log.contributors = []

          contributors.forEach((contributor) => {
            route.meta.frontmatter.git_log.contributors.push(contributor)
          })

          // Output debug information based on configuration or environment variables
          if (options?.debug !== false)
            (options?.debug ? consola.info : consola.debug)(debugInfo)
        }
        catch (error: any) {
          if (process.platform === 'linux' && error.message.includes(tty)) {
            consola.warn(`${yellow('valaxy-addon-git-log')}: The path ${tty} does not exist`)
            _options.contributor.mode = 'log'
          }
          else {
            consola.error(`${yellow('valaxy-addon-git-log')}: ${error}`)
          }
        }
      }
    })
  },
}))
