import type { EditableTreeNode } from 'unplugin-vue-router'
import type { GitLogFileEntry, GitLogOptions } from '../types'
import path from 'node:path'
import process from 'node:process'
import consola from 'consola'
import fs from 'fs-extra'
import { getChangelog } from './changeLog'
import { getContributors } from './contributor'

export const destDir = path.resolve(process.cwd(), './public')
// Only allow files from the user's working directory 'pages' folder
export const currentWorkingDirectory = `${process.cwd()}/pages`
let basePath: string

export function setBasePath(path: string) {
  basePath = path
}

export function getBasePath() {
  return basePath
}

export async function handleGitLogInfo(options: GitLogOptions, route: EditableTreeNode) {
  const strategy = options.contributor?.strategy
  const isPrebuilt = strategy === 'prebuilt'
  const isBuildTime = strategy === 'build-time'
  // const isRuntime = strategy === 'runtime'

  const filePath = route.components.get('default')
  if (!filePath)
    return

  if (!route.meta.frontmatter.git_log)
    route.meta.frontmatter.git_log = {}

  const gitRelativePath = filePath.replace(basePath, '').substring(1)
  route.meta.frontmatter.git_log.path = gitRelativePath

  if (!isPrebuilt && !isBuildTime)
    return

  if (!filePath.startsWith(currentWorkingDirectory))
    return

  try {
    const contributors = await getContributors(filePath, options)
    const changeLog = await getChangelog(process.env.CI ? 1000 : 100, filePath)

    if (isBuildTime) {
      route.meta.frontmatter.git_log.contributors = contributors
      route.meta.frontmatter.git_log.changeLog = changeLog
    }

    if (isPrebuilt && destDir) {
      const gitLogPath = path.join(destDir, 'git-log.json')

      let existingData = {}
      try {
        if (await fs.pathExists(gitLogPath))
          existingData = JSON.parse(await fs.readFile(gitLogPath, 'utf-8'))
      }
      catch (error) {
        consola.error(`valaxy-addon-git-log: Error reading existing git log file:`, error)
      }

      const newData: GitLogFileEntry = {
        ...existingData,
        [gitRelativePath]: {
          contributors,
          changeLog,
          path: gitRelativePath,
        },
      }

      await fs.mkdir(path.dirname(gitLogPath), { recursive: true })
      await fs.writeFile(
        gitLogPath,
        JSON.stringify(newData, null, 2),
        'utf-8',
      )
    }
  }
  catch (error) {
    consola.error(`valaxy-addon-git-log: Error processing git log for ${filePath}:`, error)
  }
}
