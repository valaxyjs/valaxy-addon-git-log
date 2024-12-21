import type { CommitInfo, ContributorInfo } from '@vueuse/metadata'

export interface GitLogOptions {
  repositoryUrl?: string
  contributor?: {
    mode?: 'log' | 'api'
    logArgs?: string
  }
}

export interface Contributor extends ContributorInfo {
  name: string
  email: string
  avatar: string
  count: number
  github?: string | null
}

export interface ChangeLog extends CommitInfo {

}

export interface GitLog {
  contributors: Contributor[]
  changeLog: ChangeLog[]
  path: string
}
