<script setup lang="ts">
import { computed } from 'vue'
import { useFrontmatter } from 'valaxy'

const frontmatter = useFrontmatter()

const gitLogContributors = computed(() => frontmatter.value.gitLogContributors)
</script>

<template>
  <div class="flex flex-wrap gap-4 pt-2">
    <div v-for="(contributor, index) in gitLogContributors" :key="index" :title="contributor.email" class="flex gap-2 items-center">
      <img :src="contributor.avatar" class="w-8 h-8 rounded-full">
      {{ contributor.name }}
    </div>
  </div>
</template>
