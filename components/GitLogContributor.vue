<script setup lang="ts">
import { useAddonGitLog } from '../client'

const { contributors } = useAddonGitLog()
</script>

<template>
  <div class="flex flex-wrap gap-4 pt-2">
    <div v-for="(contributor, index) in contributors" :key="index" :title="contributor.email" class="flex gap-2 items-center">
      <img :src="contributor.avatar" class="w-8 h-8 rounded-full" loading="lazy">
      {{ contributor.name }}
    </div>
  </div>
</template>
