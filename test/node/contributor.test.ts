import type { Contributor } from '../../types'
import { describe, expect, it } from 'vitest'
import { applyKnownLogins, resolveContributorsGitHub } from '../../node/contributor'

function makeContributor(email: string, github: string | null = null): Contributor {
  return {
    name: email.split('@')[0],
    email,
    avatar: github ? `${github}.png` : 'gravatar',
    count: 1,
    github,
    hash: 'hash',
  }
}

describe('applyKnownLogins', () => {
  it('should fill github/avatar from the seed map', () => {
    const contributors = [makeContributor('me@example.com')]
    applyKnownLogins(contributors, new Map([['me@example.com', 'me']]))

    expect(contributors[0].github).toBe('https://github.com/me')
    expect(contributors[0].avatar).toBe('https://github.com/me.png')
  })

  it('should not overwrite contributors that already have github', () => {
    const contributors = [makeContributor('me@example.com', 'https://github.com/original')]
    applyKnownLogins(contributors, new Map([['me@example.com', 'changed']]))

    expect(contributors[0].github).toBe('https://github.com/original')
  })

  it('should be a no-op without a seed map', () => {
    const contributors = [makeContributor('me@example.com')]
    applyKnownLogins(contributors)
    expect(contributors[0].github).toBeNull()
  })
})

describe('resolveContributorsGitHub', () => {
  it('should skip the GitHub API when the cache covers every email', async () => {
    const contributors = [
      makeContributor('alice@example.com'),
      makeContributor('bob@example.com'),
    ]

    // If this hit the API, the unmocked @octokit/rest would attempt a real
    // network request. A fully-seeded cache must short-circuit before that.
    const result = await resolveContributorsGitHub(
      contributors,
      'https://github.com/owner/repo',
      new Map([
        ['alice@example.com', 'alice'],
        ['bob@example.com', 'bob'],
      ]),
    )

    expect(result[0].github).toBe('https://github.com/alice')
    expect(result[1].github).toBe('https://github.com/bob')
  })

  it('should return contributors unchanged without a repositoryUrl', async () => {
    const contributors = [makeContributor('me@example.com')]
    const result = await resolveContributorsGitHub(contributors)
    expect(result[0].github).toBeNull()
  })
})
