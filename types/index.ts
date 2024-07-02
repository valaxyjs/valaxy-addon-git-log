export interface GitLogOptions {
  repositoryUrl?: string
  contributor?: {
    mode?: 'shortLog' | 'log' | 'api'
    logArgs?: string
  }
  debug?: boolean
}

export interface Contributor {
  name: string
  email: string
  avatar: string
  count: number
}
