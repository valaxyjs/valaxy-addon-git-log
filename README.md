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
      repositoryUrl: 'https://github.com/your-username/your-repository.git',
      contributor: {
        strategy: 'prebuilt', // 'prebuilt' | 'build-time' | 'runtime',
        // logArgs: '--first-parent --follow',
      },
      changelog: {
        includeTypes: ['feat', 'fix'],
        includeBreaking: true,
      },
    }),
  ],
})
```

| Name                          | Type                                          | Default       | Description                                                                  |
| ----------------------------- | --------------------------------------------- | ------------- | ---------------------------------------------------------------------------- |
| repositoryUrl                 | `string`                                      | `undefined`   | GitHub repository URL                                                        |
| contributor.strategy          | `'prebuilt'` \| `'build-time'` \| `'runtime'` | `'prebuilt'`  | Data fetching strategy                                                       |
| contributor.logArgs           | `string`                                      | `''`          | Extra `git log` arguments (for `'prebuilt'` and `'build-time'`)              |
| contributor.resolveGitHub     | `boolean`                                     | `true`        | Look up GitHub usernames for non-noreply emails (requires `repositoryUrl`)   |
| contributor.githubCache       | `string`                                      | `undefined`   | Path to a small, committable `email -> login` cache (see tip below)          |

> [!TIP]
> **Avoiding GitHub API rate limits.** GitHub username resolution (`resolveGitHub`) uses the GitHub API, which is limited to **60 requests/hour** for anonymous requests — easy to exhaust on a shared CI IP, surfacing as `403` / `Failed to resolve GitHub usernames`. Pick whichever fits your deployment:
>
> - **Commit a `githubCache` file (recommended, zero-config).** Point `contributor.githubCache` at a small JSON file and commit it:
>   ```ts
>   addonGitLog({
>     repositoryUrl: 'https://github.com/you/repo.git',
>     contributor: { githubCache: '.valaxy/git-log-contributors.json' },
>   })
>   ```
>   It stores only `email -> login` pairs, so it stays tiny and stable (unlike the large, churning `git-log.json` build artifact). On the next build, cached logins seed resolution — already-known emails skip the API, yielding **near-zero calls even without a token**. Delete the file to force a refresh.
> - **Set `GITHUB_TOKEN` (or `GH_TOKEN`).** When present, requests are authenticated, raising the limit to **5000/hour**. GitHub Actions injects `GITHUB_TOKEN` into every workflow automatically — just expose it to the build step:
>   ```yaml
>   - run: pnpm build # or your docs build command
>     env:
>       GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
>   ```
> - **Or set `resolveGitHub: false`** to skip the API entirely. GitHub *noreply* emails are still resolved locally (no API); only non-noreply emails fall back to Gravatar/initials.
| changelog.includeTypes        | `string[]`                                    | `['feat', 'fix']` | Conventional-commit types included in the changelog                      |
| changelog.includeBreaking     | `boolean`                                     | `true`        | Whether to include `type!:` / `type(scope)!:` breaking commits               |
| changelog.maxCount            | `number`                                      | `100` (`1000` in CI) | Max commits per file pulled from `git log`                            |

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
}

// type: Contributor[]
```

| Name   | Type             | Description                                                        |
| ------ | ---------------- | ------------------------------------------------------------------ |
| name   | `string`         | Contributor's name                                                 |
| email  | `string`         | Contributor's email                                                |
| avatar | `string`         | Contributor's avatar URL, obtained through gravatar based on email |
| count  | `number`         | Number of contributions                                            |
| github | `string \| null` | Only supported `api` mode                                          |
| hash   | `string`         | A unique hash generated based on the contributor's email           |

### useGitLogState

Same data as `useGitLog`, but also exposes loading and error state — useful when rendering UI that depends on the prebuilt `git-log.json` fetch.

```ts
import { useGitLogState } from 'valaxy-addon-git-log'

const { data, isLoading, error } = useGitLogState()
```

**Return Type:**

```ts
{
  data: Ref<GitLog>
  isLoading: Ref<boolean>
  error: Ref<Error | null>
}
```

| Name      | Type                | Description                                              |
| --------- | ------------------- | -------------------------------------------------------- |
| `data`    | `Ref<GitLog>`       | Same shape as `useGitLog`. Updates once the fetch lands. |
| `isLoading` | `Ref<boolean>`    | `true` while `git-log.json` is being fetched.            |
| `error`   | `Ref<Error \| null>` | Set if the fetch / parse fails (e.g. 404, bad JSON).     |

### useChangelog

```ts
import { useChangelog } from 'valaxy-addon-git-log'

const changelog = useChangelog()
```

**Return Type:**

```ts
export interface Changelog {
  hash: string
  date: string
  message: string
  refs?: string
  /** @deprecated never reliably populated; will be removed in a future major */
  body?: string
  author_name: string
  author_email: string
  version?: string
  functions?: string[]
}

// type: Changelog[]
```

| Name           | Type                    | Description                                                                                 |
| -------------- | ----------------------- | ------------------------------------------------------------------------------------------- |
| `hash`         | `string`                | Commit hash.                                                                                |
| `date`         | `string`                | ISO 8601 author date of the commit.                                                         |
| `message`      | `string`                | Commit subject (first line).                                                                |
| `refs`         | `string` \| `undefined` | Reserved for refs metadata; currently always empty.                                         |
| `body`         | `string` \| `undefined` | **Deprecated** — never reliably populated due to `--name-only` output collisions.           |
| `author_name`  | `string`                | Name of the commit author.                                                                  |
| `author_email` | `string`                | Email of the commit author.                                                                 |
| `version`      | `string` \| `undefined` | Parsed version, only set on `chore: release vX.Y.Z` commits.                                |
| `functions`    | `string[]` \| `undefined` | Workspace package names extracted from changed file paths (single-file `getChangelog` only). |

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
