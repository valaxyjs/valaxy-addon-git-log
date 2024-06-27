import process from 'node:process'
import { defineValaxyAddon } from 'valaxy'
import consola from 'consola'
import pkg from '../package.json'
import { countAndSortContributors, getContributors } from '../utils'

export const addonGitLog = defineValaxyAddon(options => ({
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

        try {
          const contributors = getContributors(filePath)
          const sortedContributors = countAndSortContributors(contributors)

          if (!route.meta.frontmatter.gitLogs)
            route.meta.frontmatter.gitLogContributors = []

          sortedContributors.forEach((contributor) => {
            route.meta.frontmatter.gitLogContributors.push(contributor)
          })
        }
        catch (error) {
          consola.error(error)
        }
      }
    })
  },
}))
