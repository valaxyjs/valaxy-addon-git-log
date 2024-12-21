import type { Plugin } from 'vite'
import type { Contributor } from '../types'

const ID = 'virtual:git-log/contributors'

export function Contributors(data: Contributor[]): Plugin {
  return {
    name: 'git-log-contributors',
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
