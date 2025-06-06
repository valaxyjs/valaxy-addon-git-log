import type { Plugin } from 'vite'
import type { Changelog as ChangelogType } from '../types'

const ID = 'virtual:git-log/changelog'

export function Changelog(data: ChangelogType[]): Plugin {
  return {
    name: 'git-log-changelog',
    resolveId(id) {
      return id === ID ? ID : null
    },
    load(id) {
      if (id !== ID)
        return null
      return `export default ${JSON.stringify(data)}`
    },
  }
}
