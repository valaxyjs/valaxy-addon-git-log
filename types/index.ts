export interface Contributor {
  name: string
  email: string
  avatar: string
  count: number
}

export interface GitLogOptions {
  debug: boolean
  contributor?: {
    mode?: 'shortLog' | 'log'
  }
}
