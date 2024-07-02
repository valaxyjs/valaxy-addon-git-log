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
import { useAddonGitLog } from '../client'

const { contributors } = useAddonGitLog()
</script>

<template>
  <div class="flex flex-wrap gap-4 pt-2">
    <div v-for="(contributor, index) in contributors" :key="index" :title="contributor.email" class="flex gap-2 items-center">
      <img :src="contributor.avatar" class="w-8 h-8 rounded-full">
      {{ contributor.name }}
    </div>
  </div>
</template>

<style lang="scss">
// custom twikoo style
</style>
```

## Configuration items

You can configure the git-log addon in the following form.

```ts
export default defineValaxyConfig<ThemeConfig>({
  // other configs.
  addons: [
    // other addon configs.
    addonGitLog({
      debug: false,
      contributor: {
        mode: 'api',
        logArgs: '--first-parent --follow', // git command parameters
      },
      repositoryUrl: 'https://github.com/your_name/your_repository_name.git', // your repository url path
    }),
    // other addon configs.
  ],
  // other configs.
})
```

### Parameter analysis

- `debug` : this param which is show log in terminal.Default value is `true`,that means you can see the log information on terminal when you build your valaxy.
- `contributor.mode` :  this parm has three options: `api`,`log`,`shortLog`:
  - `api`: you can use all the command, even in static service.
  - `log`:
  - `shortLog`:
- `logArgs`: you can use any git command parameters in this config. [reference](<https://git-scm.com/book/en/v2>).
- `repositoryUrl`: this param is your your repository url path which is you want to get contributor information
