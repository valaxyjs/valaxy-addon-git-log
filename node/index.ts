import { defineValaxyAddon } from 'valaxy'
import pkg from '../package.json'
import { getContributors, countAndSortContributors } from '../utils'

export const addonGitLog = defineValaxyAddon(options => ({
  name: pkg.name,
  enable: true,
  options,

  setup(valaxy) {
    valaxy.hook('vue-router:extendRoute', async (route) => {
      const filePath = route.components.get("default") as string;
      if (filePath) {
        const contributors = getContributors(filePath)
        const sortedContributors = countAndSortContributors(contributors);

        if (!route.meta.frontmatter.gitLogs) {
          route.meta.frontmatter.gitLogContributors = [];
        }

        sortedContributors.forEach(contributor => {
          route.meta.frontmatter.gitLogContributors.push(contributor)
        })
      }
    })
  },
}))
