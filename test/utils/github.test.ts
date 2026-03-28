import { describe, expect, it } from 'vitest'
import { guessGitHubUsername, parseGithubUrl } from '../../utils/github'

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
