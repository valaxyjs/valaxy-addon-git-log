<script setup lang="ts">
import { useAddonGitLog } from '../client'

const { contributors } = useAddonGitLog()
</script>

<template>
  <ul class="git-log-contributor" flex="~ wrap gap-2" pt-2>
    <li v-for="(contributor, index) in contributors" :key="index" flex="~ items-center gap-2">
      <span class="contributor-avatar">
        <a :href="contributor.github || ''" target="_blank" aria-label="Contributor image" :title="contributor.email">
          <img :src="contributor.avatar" width="32" height="32" :alt="contributor.name" loading="lazy" decoding="async" rounded-full>
        </a>
      </span>

      <span class="contributor-name">
        <a :href="contributor.github || ''" target="_blank" :title="contributor.email">
          {{ contributor.name }}
        </a>
      </span>
    </li>
  </ul>
</template>

<style lang="scss" scoped>
.git-log-contributor {
  a {
    color: inherit;
    text-decoration: none;

    &:hover {
      color: var(--va-c-primary);
    }
  }
}
</style>
