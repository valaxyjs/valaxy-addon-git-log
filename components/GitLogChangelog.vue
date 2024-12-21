<script setup lang="ts">
import { functions } from '@vueuse/metadata'
import changelog from 'virtual:git-log/changelog'
import { computed } from 'vue'
import { renderCommitMessage } from '../utils'

const props = defineProps<{ fn: string }>()
const info = computed(() => functions.find(i => i.name === props.fn))

const names = computed(() => [props.fn, ...info.value?.alias || []])
const commits = computed(() => {
  const related = changelog
    .filter(c => c.version || c.functions?.some(i => names.value.includes(i)))
  return related.filter((i, idx) => {
    if (i.version && (!related[idx + 1] || related[idx + 1]?.version))
      return false
    return true
  })
})
</script>

<template>
  <em v-if="!commits.length" opacity="70">No recent changes</em>

  <div class="grid grid-cols-[30px_auto] gap-1.5 children:my-auto -ml-1">
    <template v-for="(commit, idx) of commits" :key="commit.hash">
      <template v-if="idx === 0 && !commit.version">
        <div m="t-1" />
        <div m="t-1" />
        <div class="m-auto h-7 w-7 inline-flex rounded-full bg-gray-400/10 text-sm opacity-90">
          <octicon-git-pull-request-draft-16 m="auto" />
        </div>
        <div>
          <code>Pending for release...</code>
        </div>
      </template>
      <template v-if="commit.version">
        <div m="t-1" />
        <div m="t-1" />
        <div class="m-auto h-7 w-7 inline-flex rounded-full bg-gray-400/10 text-sm opacity-90">
          <octicon-rocket-16 m="auto" />
        </div>
        <div>
          <a
            :href="`https://github.com/vueuse/vueuse/releases/tag/${commit.version}`"
            target="_blank"
          >
            <code class="!text-primary font-bold">{{ commit.version }}</code>
          </a>
          <span class="text-xs opacity-50"> on {{ new Date(commit.date).toLocaleDateString() }}</span>
        </div>
      </template>
      <template v-else>
        <octicon-git-commit-16 class="m-auto rotate-90 transform opacity-30" />
        <div>
          <a :href="`https://github.com/vueuse/vueuse/commit/${commit.hash}`" target="_blank">
            <code class="!hover:text-primary !text-xs !text-$vp-c-text-2">{{ commit.hash.slice(0, 5) }}</code>
          </a>
          <span text="sm">
            -
            <span v-html="renderCommitMessage(commit.message.replace(`(${fn})`, ''))" />
          </span>
        </div>
      </template>
    </template>
  </div>
</template>
