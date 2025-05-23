<h1 align="center">valaxy-addon-git-log</h1>

<pre align="center">
Integrate Valaxy's Git Logs plugin to display contributor information
</pre>

<p align="center">
<a href="https://www.npmjs.com/package/valaxy-addon-git-log" rel="nofollow"><img src="https://img.shields.io/npm/v/valaxy-addon-git-log?color=0078E7" alt="NPM version"></a>
</p>

## Installing this Plugin

```bash
pnpm add valaxy-addon-git-log
```

By default, the plugin retrieves Git information via API. Due to the limitations of static servers, it may not automatically obtain the repository address from the Git environment. Therefore, it is recommended to manually provide the repository address as shown below:

```ts
import { defineValaxyConfig } from 'valaxy'
import { addonGitLog } from 'valaxy-addon-git-log'

export default defineValaxyConfig({
  addons: [
    addonGitLog({
      repositoryUrl: 'https://github.com/your-username/your-repository.git',
    }),
  ],
})
```

## Using this Plugin

### Basic Usage

To add Git contributors to a page, use the `GitLogContributor` component:

```vue
<template>
  <GitLogContributor />
</template>
```

### Customization examples

If you are a theme developer or want to customize pages with git information, you can refer to the following example:

```vue
<script setup lang="ts">
import { useGitLog } from 'valaxy-addon-git-log'

const gitLog = useGitLog()
</script>

<template>
  <ul>
    <li v-for="contributor in gitLog.contributors" :key="contributor.email">
      <img :src="contributor.avatar" alt="Avatar" width="30" height="30">
      {{ contributor.name }}
    </li>
  </ul>
</template>
```

## Configuration / Options

In your project (wether theme or addon), you can write this in `valaxy.config.ts`.

```ts
export default defineValaxyConfig<ThemeConfig>({
  addons: [
    addonGitLog({
      contributor: {
        strategy: 'prebuilt', // 'prebuilt' | 'build-time' | 'runtime',
        // logArgs: '--first-parent --follow',
      },
    }),
  ],
})
```

| Name                   | Type                     | Default      | Description |
|------------------------|--------------------------|--------------|-------------|
| repositoryUrl          | `string`                | `undefined`  | GitHub repository URL |
| contributor.strategy   | `'prebuilt'` \| `'build-time'` \| `'runtime'` | `'prebuilt'` | Data fetching strategy |
| contributor.logArgs    | `string`                | `''`         | Git log arguments (for 'prebuilt' and 'build-time') |
| contributor.githubToken| `string`                | `undefined`  | GitHub token (required for 'runtime' strategy) |

### Strategy Comparison

| Strategy     | Build Requirement | Data Freshness | Host Compatibility | Rate Limiting | Recommended Use Case |
|--------------|-------------------|----------------|--------------------|---------------|----------------------|
| **prebuilt** | Requires local Git | ⚠️ Static snapshot | ✅ All static hosts | ✅ None | Static site generation (SSG) |
| **build-time** | Needs CI Git access | ✅ Build-time fresh | ❌ Limited on:<br>• Vercel<br>• Netlify<br>• Cloudflare Pages | ✅ None | Self-hosted CI |
| **runtime**  | No build tools | ✅ Real-time | ✅ Universal | ⚠️ GitHub API:<br>• 60/hr (anon)<br>• 5000/hr (authed) | Client-side rendered |

## Components

### GitLogContributor

```vue
<template>
  <GitLogContributor />
</template>
```

### GitLogChangelog

```vue
<template>
  <GitLogChangelog />
</template>
```

## Composables

### useGitLog

This composable provides a simple way to fetch Git log data based on the current page's context.

```ts
import { useGitLog } from 'valaxy-addon-git-log'
import { computed } from 'vue'

const gitLog = useGitLog()
const contributors = computed(() => gitLog.value.contributors)
const changeLog = computed(() => gitLog.value.changeLog)
```

**Return Type:**

```ts
export interface GitLog {
  contributors: Contributor[]
  changeLog: Changelog[]
  path: string
}
```

| Name         | Type            | Description                      |
| ------------ | --------------- | -------------------------------- |
| contributors | `Contributor[]` | see `useContributor` return type |
| changeLog    | `Changelog[]`   | see `useChangelog` return type   |
| path         | `string`        |                                  |

### useContributor

```ts
import { useContributor } from 'valaxy-addon-git-log'

const contributor = useContributor()
```

**Return Type:**

```ts
export interface Contributor {
  name: string
  email: string
  avatar: string
  count: number
  github: string | null
  hash: string
}[]
```

| Name   | Type             | Description                                                        |
| ------ | ---------------- | ------------------------------------------------------------------ |
| name   | `string`         | Contributor's name                                                 |
| email  | `string`         | Contributor's email                                                |
| avatar | `string`         | Contributor's avatar URL, obtained through gravatar based on email |
| count  | `number`         | Number of contributions                                            |
| github | `string \| null` | Only supported `api` mode                                          |
| hash   | `string`         | A unique hash generated based on the contributor's email           |

### useChangelog

```ts
import { useChangelog } from 'valaxy-addon-git-log'

const changelog = useChangelog()
```

**Return Type:**

```ts
export interface Changelog {
  functions: string[]
  version?: string
  hash: string
  date: string
  message: string
  refs?: string
  body?: string
  author_name: string
  author_email: string
}[]
```

| Name           | Type                    | Description                                                             |
| -------------- | ----------------------- | ----------------------------------------------------------------------- |
| `functions`    | `string[]`              | List of functions affected or related to the changelog entry.           |
| `version`      | `string` \| `undefined` | Optional version number for the release or update.                      |
| `hash`         | `string`                | Unique identifier or commit hash for the change.                        |
| `date`         | `string`                | The date when the change was made or the changelog entry was created.   |
| `message`      | `string`                | A brief summary or description of the change.                           |
| `refs`         | `string` \| `undefined` | Optional reference information, such as ticket IDs or PR links.         |
| `body`         | `string` \| `undefined` | Optional detailed body content or additional explanation of the change. |
| `author_name`  | `string`                | Name of the person who made the change.                                 |
| `author_email` | `string`                | Email address of the person who made the change.                        |

## Other

### Virtual modules

```ts
import changelog from 'virtual:git-log/changelog'
```

The `changelog` variable contains all the commit logs.

```ts
import contributors from 'virtual:git-log/contributors'
```

The `contributors` variable contains information about all contributors.
