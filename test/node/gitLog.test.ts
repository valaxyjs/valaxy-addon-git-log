import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock simple-git before importing modules that depend on it
vi.mock('simple-git', () => {
  const mockGit = {
    raw: vi.fn(),
    revparse: vi.fn(),
  }
  return { default: () => mockGit }
})

// Mock fs-extra
vi.mock('fs-extra', () => ({
  default: {
    pathExists: vi.fn().mockResolvedValue(false),
    readFile: vi.fn(),
    writeFile: vi.fn(),
    mkdir: vi.fn(),
  },
}))

// Mock consola
vi.mock('consola', () => ({
  default: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock gravatar
vi.mock('gravatar', () => ({
  default: {
    url: (email: string) => `https://gravatar.com/${email}`,
  },
}))

// Mock md5
vi.mock('md5', () => ({
  default: (str: string) => `md5-${str}`,
}))

const FIELD_SEP = '\x1F'

describe('gitLog batch parsing', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should parse contributor data from git log output', async () => {
    const { git } = await import('../../node/index')
    const rawMock = vi.mocked(git.raw)

    // Simulate contributor git log output using \x1f separator
    const contributorOutput = [
      `---COMMIT_SEP---Alice${FIELD_SEP}alice@example.com`,
      'pages/index.md',
      `---COMMIT_SEP---Bob${FIELD_SEP}bob@example.com`,
      'pages/index.md',
      `---COMMIT_SEP---Alice${FIELD_SEP}alice@example.com`,
      'pages/about.md',
    ].join('\n')

    // Simulate changelog git log output (no matching messages → empty)
    const changelogOutput = ''

    rawMock
      .mockResolvedValueOnce(contributorOutput) // batchGetContributors
      .mockResolvedValueOnce(changelogOutput) // batchGetChangelog

    // Import the module under test
    const gitLogModule = await import('../../node/gitLog')

    // Set basePath directly for testing
    gitLogModule.setBasePath('/test/repo')

    // Create mock route
    const mockRoute = {
      components: new Map([['default', '/test/repo/pages/index.md']]),
      meta: { frontmatter: {} },
    }

    await gitLogModule.handleGitLogInfo(
      { contributor: { strategy: 'build-time' } },
      mockRoute as any,
    )

    // Verify frontmatter was set with path
    const fm = mockRoute.meta.frontmatter as any
    expect(fm.git_log).toBeDefined()
    expect(fm.git_log.path).toBe('pages/index.md')
  })

  it('should parse contributor names containing pipe characters', async () => {
    const { git } = await import('../../node/index')
    const rawMock = vi.mocked(git.raw)

    // Author name containing | should NOT break parsing with \x1f separator
    const contributorOutput = [
      `---COMMIT_SEP---Alice|Bob${FIELD_SEP}alice@example.com`,
      'pages/index.md',
    ].join('\n')

    const changelogOutput = ''

    rawMock
      .mockResolvedValueOnce(contributorOutput)
      .mockResolvedValueOnce(changelogOutput)

    const gitLogModule = await import('../../node/gitLog')
    gitLogModule.setBasePath('/test/repo')

    const mockRoute = {
      components: new Map([['default', '/test/repo/pages/index.md']]),
      meta: { frontmatter: {} },
    }

    await gitLogModule.handleGitLogInfo(
      { contributor: { strategy: 'build-time' } },
      mockRoute as any,
    )

    const fm = mockRoute.meta.frontmatter as any
    expect(fm.git_log).toBeDefined()
    expect(fm.git_log.path).toBe('pages/index.md')
  })

  it('should skip routes without default component', async () => {
    const gitLogModule = await import('../../node/gitLog')
    gitLogModule.setBasePath('/test/repo')

    const mockRoute = {
      components: new Map<string, string>(),
      meta: { frontmatter: {} },
    }

    await gitLogModule.handleGitLogInfo(
      { contributor: { strategy: 'build-time' } },
      mockRoute as any,
    )

    const fm = mockRoute.meta.frontmatter as any
    expect(fm.git_log).toBeUndefined()
  })

  it('should handle runtime strategy by setting path only', async () => {
    const gitLogModule = await import('../../node/gitLog')
    gitLogModule.setBasePath('/test/repo')

    const mockRoute = {
      components: new Map([['default', '/test/repo/pages/index.md']]),
      meta: { frontmatter: {} },
    }

    await gitLogModule.handleGitLogInfo(
      { contributor: { strategy: 'runtime' } },
      mockRoute as any,
    )

    const fm = mockRoute.meta.frontmatter as any
    expect(fm.git_log.path).toBe('pages/index.md')
  })

  it('should flush empty pending routes without error', async () => {
    const gitLogModule = await import('../../node/gitLog')
    // Should not throw
    await gitLogModule.flushGitLogBatch({ contributor: { strategy: 'prebuilt' } })
  })
})

describe('path utilities', () => {
  it('destDir should resolve to public directory', async () => {
    const { destDir } = await import('../../node/gitLog')
    expect(destDir).toBe(path.resolve(process.cwd(), './public'))
  })

  it('currentWorkingDirectory should resolve to pages directory', async () => {
    const { currentWorkingDirectory } = await import('../../node/gitLog')
    expect(currentWorkingDirectory).toBe(path.join(process.cwd(), 'pages'))
  })

  it('getBasePath should return undefined initially', async () => {
    vi.resetModules()
    const { getBasePath } = await import('../../node/gitLog')
    expect(getBasePath()).toBeUndefined()
  })

  it('setBasePath + getBasePath roundtrip', async () => {
    vi.resetModules()
    const { setBasePath, getBasePath } = await import('../../node/gitLog')
    setBasePath('/custom/path')
    expect(getBasePath()).toBe('/custom/path')
  })
})

describe('shouldIncludeCommit', () => {
  it('should include feat commits by default', async () => {
    const { shouldIncludeCommit } = await import('../../types')
    expect(shouldIncludeCommit('feat: add new feature')).toBe(true)
    expect(shouldIncludeCommit('feat(scope): something')).toBe(true)
  })

  it('should include fix commits by default', async () => {
    const { shouldIncludeCommit } = await import('../../types')
    expect(shouldIncludeCommit('fix: resolve issue')).toBe(true)
  })

  it('should include breaking changes by default', async () => {
    const { shouldIncludeCommit } = await import('../../types')
    expect(shouldIncludeCommit('refactor!: breaking change')).toBe(true)
  })

  it('should include chore: release', async () => {
    const { shouldIncludeCommit } = await import('../../types')
    expect(shouldIncludeCommit('chore: release v1.0.0')).toBe(true)
  })

  it('should exclude unmatched commits', async () => {
    const { shouldIncludeCommit } = await import('../../types')
    expect(shouldIncludeCommit('chore: update deps')).toBe(false)
    expect(shouldIncludeCommit('docs: update readme')).toBe(false)
    expect(shouldIncludeCommit('style: formatting')).toBe(false)
  })

  it('should respect custom includeTypes', async () => {
    const { shouldIncludeCommit } = await import('../../types')
    const options = { includeTypes: ['feat', 'fix', 'docs', 'perf'] }
    expect(shouldIncludeCommit('docs: update readme', options)).toBe(true)
    expect(shouldIncludeCommit('perf: optimize query', options)).toBe(true)
    expect(shouldIncludeCommit('style: formatting', options)).toBe(false)
  })

  it('should respect includeBreaking: false', async () => {
    const { shouldIncludeCommit } = await import('../../types')
    const options = { includeBreaking: false }
    expect(shouldIncludeCommit('refactor!: breaking', options)).toBe(false)
  })
})
