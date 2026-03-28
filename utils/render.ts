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

export function renderMarkdown(markdownText = '') {
  const htmlText = markdownText
    .replace(RE_H3, '<h3>$1</h3>')
    .replace(RE_H2, '<h2>$1</h2>')
    .replace(RE_H1, '<h1>$1</h1>')
    .replace(RE_BLOCKQUOTE, '<blockquote>$1</blockquote>')
    .replace(RE_BOLD, '<b>$1</b>')
    .replace(RE_ITALIC, '<i>$1</i>')
    .replace(RE_IMG, '<img alt=\'$1\' src=\'$2\' />')
    .replace(RE_LINK, '<a href=\'$2\'>$1</a>')
    .replace(RE_CODE, '<code>$1</code>')
    .replace(RE_NEWLINE, '<br />')

  return htmlText.trim()
}

const RE_ISSUE = /#(\d+)/g

export function renderCommitMessage(msg: string, repo: string) {
  const html = renderMarkdown(msg)
  if (!repo)
    return html
  return html.replace(RE_ISSUE, `<a href=\'${repo}/issues/$1\'>#$1</a>`)
}
