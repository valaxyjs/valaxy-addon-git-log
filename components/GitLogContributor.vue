<script setup lang="ts">
import type { Contributor } from '../types'
import { computed } from 'vue'
import { useContributor } from '../client'

const props = defineProps<{
  contributors?: Contributor[]
}>()

const gitLogContributor = useContributor()

const contributors = computed(() => props.contributors || gitLogContributor?.value)

function onAvatarError(e: Event) {
  const img = e.target as HTMLImageElement
  img.classList.add('broken')
}
</script>

<template>
  <ul class="va-git-log-contributor" flex="~ wrap gap-2" pt-2>
    <li v-for="(contributor, index) in contributors" :key="index" flex="~ items-center gap-2">
      <span class="va-contributor-avatar" :title="contributor.email">
        <img
          :src="contributor.avatar" width="32" height="32" aria-label="Contributor image"
          :alt="contributor.name" loading="lazy" decoding="async" rounded-full
          @error="onAvatarError"
        >
        <span
          class="va-contributor-avatar-fallback" aria-hidden="true"
        >
          {{ contributor.name.charAt(0).toUpperCase() }}
        </span>
      </span>

      <span class="va-contributor-name">
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
.va-git-log-contributor {
  a {
    color: inherit;
    text-decoration: none;

    &:hover {
      color: var(--va-c-primary);
    }
  }
}

.va-contributor-avatar {
  display: inline-flex;
  width: 32px;
  height: 32px;
  flex-shrink: 0;

  img {
    width: 32px;
    height: 32px;
    object-fit: cover;

    &.broken {
      display: none;
    }

    &.broken + .va-contributor-avatar-fallback {
      display: flex;
    }
  }

  &-fallback {
    display: none;
    width: 32px;
    height: 32px;
    border-radius: 9999px;
    background-color: var(--va-c-bg-mute, #e5e7eb);
    color: var(--va-c-text-2, #6b7280);
    font-size: 14px;
    font-weight: 500;
    align-items: center;
    justify-content: center;
  }
}
</style>
