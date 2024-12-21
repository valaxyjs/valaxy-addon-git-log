import type { CommitInfo, ContributorInfo } from '@vueuse/metadata'

export interface GitLogOptions {
  repositoryUrl?: string
  contributor?: {
    mode?: 'log' | 'api'
    logArgs?: string
  }
}

export interface Contributor extends ContributorInfo {
  email: string
  avatar: string
  github?: string | null
}

export interface ChangeLog extends CommitInfo {

}

export interface GitLog {
  contributors: Contributor[]
  changeLog: ChangeLog[]
  path: string
}
