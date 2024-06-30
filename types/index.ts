export interface GitLogOptions {
  debug?: boolean
  contributor?: {
    mode?: 'shortLog' | 'log' | 'api'
    logArgs?: string
  }
  repositoryUrl?: string
}

export interface Contributor {
  name: string
  email: string
  avatar: string
  count: number
}
