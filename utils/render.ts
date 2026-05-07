// https://github.com/vueuse/vueuse/blob/main/packages/.vitepress/theme/utils.ts

const RE_H3 = /^### (.*$)/gm
const RE_H2 = /^## (.*$)/gm
const RE_H1 = /^# (.*$)/gm
const RE_BLOCKQUOTE = /^> (.*$)/gm
const RE_BOLD = /\*\*(.*)\*\*/g
const RE_ITALIC = /\*(.*)\*/g
const RE_IMG = /!\[(.*?)\]\((.*?)\)/g
const RE_LINK = /\[(.*?)\]\((.*?)\)/g
const RE_CODE = /`(.*?)`/g
const RE_NEWLINE = /\n$/gm

/**
 * Protocols allowed in markdown links and images.
 * Blocks `javascript:`, `data:`, `vbscript:`, protocol-relative `//` URLs, etc.
 */
const SAFE_URL_RE = /^(?:https?:\/\/|\/(?!\/)|#|mailto:)/i

/**
 * Escape HTML special characters to prevent XSS attacks.
 * Only escapes characters that can open HTML tags or attributes.
 * `>` is intentionally preserved so that markdown blockquote syntax still works.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Sanitize a URL: only allow safe protocols.
 * Returns empty string for dangerous URLs like `javascript:`, `data:`, etc.
 */
function sanitizeUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed)
    return ''
  return SAFE_URL_RE.test(trimmed) ? trimmed : ''
}

export function renderMarkdown(markdownText = '') {
  const htmlText = escapeHtml(markdownText)
    .replace(RE_H3, '<h3>$1</h3>')
    .replace(RE_H2, '<h2>$1</h2>')
    .replace(RE_H1, '<h1>$1</h1>')
    .replace(RE_BLOCKQUOTE, '<blockquote>$1</blockquote>')
    .replace(RE_BOLD, '<b>$1</b>')
    .replace(RE_ITALIC, '<i>$1</i>')
    .replace(RE_IMG, (_, alt, src) => {
      const safeSrc = sanitizeUrl(src)
      return safeSrc ? `<img alt='${alt}' src='${safeSrc}' />` : alt
    })
    .replace(RE_LINK, (_, text, href) => {
      const safeHref = sanitizeUrl(href)
      return safeHref ? `<a href='${safeHref}'>${text}</a>` : text
    })
    .replace(RE_CODE, '<code>$1</code>')
    .replace(RE_NEWLINE, '<br />')

  return htmlText.trim()
}

const RE_ISSUE = /#(\d+)/g

/**
 * Replace #issue references in HTML text that is NOT inside an <a> element.
 * Splits on anchor tags to avoid producing nested <a> elements.
 */
function replaceIssueRefs(html: string, repo: string): string {
  // Split by <a ...>...</a> segments, only replace in non-anchor parts
  return html.replace(/(<a\s[^>]*>[\s\S]*?<\/a>)|([^<]*(?:<(?!a\s|\/a>)[^<]*)*)/gi, (match, anchor) => {
    if (anchor)
      return match // preserve anchor tags untouched
    return match.replace(RE_ISSUE, `<a href='${repo}/issues/$1'>#$1</a>`)
  })
}

export function renderCommitMessage(msg: string, repo: string) {
  const html = renderMarkdown(msg)
  if (!repo)
    return html
  return replaceIssueRefs(html, repo)
}
