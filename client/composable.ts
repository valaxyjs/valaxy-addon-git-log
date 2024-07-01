import { useAddonGitLogContributor } from './composables'

export function useAddonGitLog() {
  return {
    contributors: useAddonGitLogContributor(),
  }
}
