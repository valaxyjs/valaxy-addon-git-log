# valaxy-addon-git-log

## Installation

To install the `valaxy-addon-git-log`, run the following command:

```bash
pnpm add valaxy-addon-git-log
```

## Configuration

In your configuration file, import and define the addon:

```ts
import { defineValaxyConfig } from 'valaxy'
import { addonGitLog } from 'valaxy-addon-git-log'

export default defineValaxyConfig({
  addons: [
    addonGitLog(),
  ],
})
```

## Basic Usage

To add Git contributors to a page, use the `GitLogContributor` component:

```vue
<template>
  <GitLogContributor />
</template>
```

## Customization

When you add this plugin, it automatically includes `gitLogContributors` information in the `Frontmatter`. Here’s an example:

```vue
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

<style lang="scss">
// custom twikoo style
</style>
```
