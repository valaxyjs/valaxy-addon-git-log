import type { Plugin } from 'vite'
import type { ChangeLog as ChangeLogType } from '../types'

const ID = 'virtual:git-log/changelog'

export function ChangeLog(data: ChangeLogType[]): Plugin {
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
