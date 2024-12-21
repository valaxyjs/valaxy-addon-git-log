declare module 'virtual:git-log/contributors' {
  import type { Contributor } from 'valaxy-addon-git-log'

  const contributors: Contributor[]
  export default contributors
}

declare module 'virtual:git-log/changelog' {
  import type { CommitInfo } from '@vueuse/metadata'

  const changelog: CommitInfo[]
  export default changelog
}
