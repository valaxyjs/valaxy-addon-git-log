import type { CommitInfo, ContributorInfo } from '@vueuse/metadata'

export interface GitLogOptions {
  repositoryUrl?: string
  contributor?: {
    mode?: 'git' | 'api'
    logArgs?: string
  }
}

export interface Contributor extends ContributorInfo {
  name: string
  email: string
  avatar: string
  count: number
  github: string | null
}

export interface Changelog extends CommitInfo {

}

export interface GitLog {
  contributors: Contributor[]
  changeLog: Changelog[]
  path: string
}
