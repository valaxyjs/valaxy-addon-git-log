<script setup lang="ts">
import type { Contributor } from '../types'
import { computed } from 'vue'
import { useContributor } from '../client'

const props = defineProps<{
  contributors?: Contributor[]
}>()

const gitLogContributor = useContributor()

const contributors = computed(() => props.contributors || gitLogContributor?.value)
</script>

<template>
  <ul class="git-log-contributor" flex="~ wrap gap-2" pt-2>
    <li v-for="(contributor, index) in contributors" :key="index" flex="~ items-center gap-2">
      <span class="contributor-avatar" :title="contributor.email">
        <img
          :src="contributor.avatar" width="32" height="32" aria-label="Contributor image"
          :alt="contributor.name" loading="lazy" decoding="async" rounded-full
        >
      </span>

      <span class="contributor-name">
        <a v-if="contributor?.github" :href="contributor.github" :title="contributor.github" target="_blank">
          {{ contributor.name }}
        </a>
        <template v-else>
          {{ contributor.name }}
        </template>
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
