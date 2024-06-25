import { execSync } from 'node:child_process'
import { defineValaxyAddon } from 'valaxy'
import pkg from './package.json'

export * from './node'

// https://github.com/vuepress/vuepress-plugin-git-log/blob/master/lib/index.js

export const addonGitlog = defineValaxyAddon(options => ({
  name: pkg.name,
  enable: true,
  options,

  setup(valaxy) {
    valaxy.hook('build:before', async () => {
      function getContributors(filePath: string) {
        const log = execSync(`git log --pretty=format:"%an|%ae" ${filePath}`, { encoding: 'utf-8' })
        const contributors = log.split('\n').map((line) => {
          const [name, email] = line.split('|')
          return { name, email }
        })
        return contributors
      }

      function getLastUpdated(filePath: string) {
        const lastUpdated = execSync(`git log -1 --format=%ct ${filePath}`, { encoding: 'utf-8' })
        return Number.parseInt(lastUpdated, 10) * 1000
      }
    })
  },
}))
