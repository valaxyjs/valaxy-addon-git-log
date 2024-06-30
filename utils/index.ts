import { execSync } from 'node:child_process'
import gravatar from 'gravatar'
import { blue, dim, red, underline, yellow } from 'picocolors'
import consola from 'consola'

export function getContributors(filePath: string, mode: 'shortLog' | 'log', tty: string) {
  // https://git-scm.com/docs/git-shortlog#_description
  let log
  if (mode === 'log') {
    log = execSync(`git log --follow --no-merges --pretty=format:'%an <%ae>' ${filePath} | sort | uniq -c`, { encoding: 'utf-8' })
  }
  else if (mode === 'shortLog') {
    // https://nodejs.org/api/child_process.html#optionsstdio
    // const log = execSync(`git shortlog -nesc ${filePath}`, { stdio: ['inherit', 'pipe', 'pipe'], encoding: 'utf-8' })
    log = execSync(`git shortlog < ${tty} -nesc ${filePath}`, { encoding: 'utf-8' })
  }

  consola.info('shortLog', log)
  const contributors = log!.split('\n')
    .filter(line => line.trim() !== '')
    .map((line) => {
      if (!line.trim())
        throw new Error(`${yellow('valaxy-addon-git-log')} - Encountered an empty line while parsing log for file: "${underline(filePath)}"`)

      const match = line.match(/^\s*(\d+)\s+(.+)\s<(.+)>$/)
      if (!match) {
        throw new Error(`${yellow('valaxy-addon-git-log')} - Failed to parse line: "${blue(line)}"\n`
          + ` ${dim('├─')} Error: Unable to match shortlog format\n`
          + ` ${dim('└─')} File: "${underline(filePath)}"`)
      }

      try {
      // const { name, email } = JSON.parse(line)
        const [, count, name, email] = match
        const avatar = gravatar.url(email)
        // return { name, email, avatar }
        return { count: Number.parseInt(count, 10), name, email, avatar }
      }
      catch (error) {
        throw new Error(
        `${yellow('valaxy-addon-git-log')} - Failed to parse line: "${blue(line)}"\n`
        + ` ${dim('├─')} Error: ${red(error as any)}\n`
        + ` ${dim('└─')} File: "${underline(filePath)}"`,
        )
      }
    })

  return contributors
}

export function getLastUpdated(filePath: string) {
  const lastUpdated = execSync(`git log -1 --format=%ct ${filePath}`, { encoding: 'utf-8' })
  return Number.parseInt(lastUpdated, 10) * 1000
}
