declare module 'virtual:git-log/contributors' {
  import type { Contributor } from 'valaxy-addon-git-log'

  const contributors: Contributor[]
  export default contributors
}

declare module 'virtual:git-log/changelog' {
  import type { Changelog } from 'valaxy-addon-git-log'

  const changelog: Changelog[]
  export default changelog
}
