import { describe, expect, it, vi } from 'vitest'
import { guessGitHubUsername, parseGithubUrl, resolveGitHubUsers } from '../../utils/github'

describe('parseGithubUrl', () => {
  it('should parse HTTPS GitHub URL', () => {
    const result = parseGithubUrl('https://github.com/valaxyjs/valaxy-addon-git-log')
    expect(result).toEqual({ owner: 'valaxyjs', repo: 'valaxy-addon-git-log' })
  })

  it('should parse HTTPS GitHub URL with .git suffix', () => {
    const result = parseGithubUrl('https://github.com/valaxyjs/valaxy-addon-git-log.git')
    expect(result).toEqual({ owner: 'valaxyjs', repo: 'valaxy-addon-git-log' })
  })

  it('should parse SSH GitHub URL', () => {
    const result = parseGithubUrl('git@github.com:valaxyjs/valaxy-addon-git-log.git')
    expect(result).toEqual({ owner: 'valaxyjs', repo: 'valaxy-addon-git-log' })
  })

  it('should parse SSH GitHub URL without .git suffix', () => {
    const result = parseGithubUrl('git@github.com:user/repo')
    expect(result).toEqual({ owner: 'user', repo: 'repo' })
  })

  it('should throw for invalid URL', () => {
    expect(() => parseGithubUrl('https://gitlab.com/user/repo'))
      .toThrow('valaxy-addon-git-log: Invalid GitHub URL')
  })

  it('should throw for empty string', () => {
    expect(() => parseGithubUrl(''))
      .toThrow('valaxy-addon-git-log: Invalid GitHub URL')
  })
})

describe('guessGitHubUsername', () => {
  it('should extract username from noreply email', () => {
    expect(guessGitHubUsername('yunyou@users.noreply.github.com')).toBe('yunyou')
  })

  it('should extract username from noreply email with numeric prefix', () => {
    expect(guessGitHubUsername('12345+yunyou@users.noreply.github.com')).toBe('yunyou')
  })

  it('should return null for regular email', () => {
    expect(guessGitHubUsername('user@example.com')).toBeNull()
  })

  it('should return null for empty string', () => {
    expect(guessGitHubUsername('')).toBeNull()
  })
})

describe('resolveGitHubUsers', () => {
  it('should return empty map for empty emails', async () => {
    const result = await resolveGitHubUsers('owner', 'repo', [])
    expect(result).toBeInstanceOf(Map)
    expect(result.size).toBe(0)
  })

  it('should resolve emails from recent commits', async () => {
    vi.doMock('@octokit/rest', () => ({
      Octokit: class {
        repos = {
          listCommits: vi.fn().mockResolvedValue({
            data: [
              { commit: { author: { email: 'alice@example.com' } }, author: { login: 'alice' } },
              { commit: { author: { email: 'bob@example.com' } }, author: { login: 'bob' } },
            ],
          }),
        }
      },
    }))

    // Re-import to pick up the mock
    const { resolveGitHubUsers: resolve } = await import('../../utils/github')
    const result = await resolve('owner', 'repo', ['alice@example.com', 'bob@example.com'])

    expect(result.get('alice@example.com')).toBe('alice')
    expect(result.get('bob@example.com')).toBe('bob')

    vi.doUnmock('@octokit/rest')
  })

  it('should fall back to per-email queries for unresolved emails', async () => {
    const listCommitsFn = vi.fn()
      // Phase 1: recent commits - returns only alice
      .mockResolvedValueOnce({
        data: [
          { commit: { author: { email: 'alice@example.com' } }, author: { login: 'alice' } },
        ],
      })
      // Phase 3: per-email query for bob
      .mockResolvedValueOnce({
        data: [
          { commit: { author: { email: 'bob@example.com' } }, author: { login: 'bob' } },
        ],
      })

    vi.doMock('@octokit/rest', () => ({
      Octokit: class {
        repos = { listCommits: listCommitsFn }
      },
    }))

    const { resolveGitHubUsers: resolve } = await import('../../utils/github')
    const result = await resolve('owner', 'repo', ['alice@example.com', 'bob@example.com'])

    expect(result.get('alice@example.com')).toBe('alice')
    expect(result.get('bob@example.com')).toBe('bob')
    // Phase 1 (1) + Phase 3 per-email (1) = 2 calls
    expect(listCommitsFn).toHaveBeenCalledTimes(2)

    vi.doUnmock('@octokit/rest')
  })

  it('should gracefully handle API errors', async () => {
    vi.doMock('@octokit/rest', () => ({
      Octokit: class {
        repos = {
          listCommits: vi.fn().mockRejectedValue(new Error('Network error')),
        }
      },
    }))

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const { resolveGitHubUsers: resolve } = await import('../../utils/github')
    const result = await resolve('owner', 'repo', ['test@example.com'])

    expect(result.size).toBe(0)
    expect(warnSpy).toHaveBeenCalledOnce()

    warnSpy.mockRestore()
    vi.doUnmock('@octokit/rest')
  })

  it('should deduplicate emails', async () => {
    const listCommitsFn = vi.fn().mockResolvedValue({
      data: [
        { commit: { author: { email: 'dup@example.com' } }, author: { login: 'dupuser' } },
      ],
    })

    vi.doMock('@octokit/rest', () => ({
      Octokit: class {
        repos = { listCommits: listCommitsFn }
      },
    }))

    const { resolveGitHubUsers: resolve } = await import('../../utils/github')
    const result = await resolve('owner', 'repo', ['dup@example.com', 'dup@example.com', 'dup@example.com'])

    expect(result.get('dup@example.com')).toBe('dupuser')
    // Only 1 API call despite 3 duplicate emails
    expect(listCommitsFn).toHaveBeenCalledTimes(1)

    vi.doUnmock('@octokit/rest')
  })
})
