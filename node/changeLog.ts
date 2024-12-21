import type { ChangeLog } from '../types'
import { uniq } from '@vueuse/metadata'
import { git } from '.'

let cache: ChangeLog[] | undefined

export async function getChangeLog(maxCount = 200, path?: string) {
  if (cache)
    return cache

  const logs = (await git.log({ file: path, maxCount })).all.filter((i) => {
    return i.message.includes('chore: release')
      || i.message.includes('!')
      || i.message.startsWith('feat')
      || i.message.startsWith('fix')
  }) as ChangeLog[]

  for (const log of logs) {
    if (log.message.includes('chore: release')) {
      log.version = log.message.split(' ')[2].trim()
      continue
    }
    const raw = await git.raw(['diff-tree', '--no-commit-id', '--name-only', '-r', log.hash])
    delete log.body
    const files = raw.replace(/\\/g, '/').trim().split('\n')
    log.functions = uniq(
      files
        .map(i => i.match(/^packages\/\w+\/(\w+)\/\w+\.ts$/)?.[1])
        .filter(Boolean),
    )
  }

  // const result = logs.filter(i => i.functions?.length || i.version)

  return cache = logs
}
