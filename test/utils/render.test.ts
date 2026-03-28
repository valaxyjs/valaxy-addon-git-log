import { describe, expect, it } from 'vitest'
import { renderCommitMessage, renderMarkdown } from '../../utils/render'

describe('renderMarkdown', () => {
  it('should render h1', () => {
    expect(renderMarkdown('# Hello')).toBe('<h1>Hello</h1>')
  })

  it('should render h2', () => {
    expect(renderMarkdown('## Hello')).toBe('<h2>Hello</h2>')
  })

  it('should render h3', () => {
    expect(renderMarkdown('### Hello')).toBe('<h3>Hello</h3>')
  })

  it('should render blockquote', () => {
    expect(renderMarkdown('> quote')).toBe('<blockquote>quote</blockquote>')
  })

  it('should render bold text', () => {
    expect(renderMarkdown('**bold**')).toBe('<b>bold</b>')
  })

  it('should render italic text', () => {
    expect(renderMarkdown('*italic*')).toBe('<i>italic</i>')
  })

  it('should render image', () => {
    expect(renderMarkdown('![alt](http://img.png)'))
      .toBe('<img alt=\'alt\' src=\'http://img.png\' />')
  })

  it('should render link', () => {
    expect(renderMarkdown('[text](http://url)'))
      .toBe('<a href=\'http://url\'>text</a>')
  })

  it('should render inline code', () => {
    expect(renderMarkdown('`code`')).toBe('<code>code</code>')
  })

  it('should return empty string for undefined input', () => {
    expect(renderMarkdown()).toBe('')
  })

  it('should return empty string for empty input', () => {
    expect(renderMarkdown('')).toBe('')
  })
})

describe('renderCommitMessage', () => {
  it('should render issue references as links', () => {
    const result = renderCommitMessage('fix #123', 'https://github.com/user/repo')
    expect(result).toContain('https://github.com/user/repo/issues/123')
    expect(result).toContain('#123')
  })

  it('should render multiple issue references', () => {
    const result = renderCommitMessage('fix #1 and #2', 'https://github.com/user/repo')
    expect(result).toContain('issues/1')
    expect(result).toContain('issues/2')
  })

  it('should not replace issues when repo is empty', () => {
    const result = renderCommitMessage('fix #123', '')
    expect(result).toBe('fix #123')
  })

  it('should render markdown within commit message', () => {
    const result = renderCommitMessage('**feat**: new feature', 'https://github.com/user/repo')
    expect(result).toContain('<b>feat</b>')
  })
})
