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
      // contributor: {
      //   mode: 'log',
      // },
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

### Customization

If you are a theme developer or want to customize pages with git information, you can refer to the following example:

```vue
<script setup lang="ts">
import { useAddonGitLog } from 'valaxy-addon-git-log'

const { contributors } = useAddonGitLog()
</script>

<template>
  <ul>
    <li v-for="contributor in contributors" :key="contributor.email">
      <img :src="contributor.avatar" alt="Avatar" width="30" height="30">
      {{ contributor.name }}
    </li>
  </ul>
</template>
```

Regarding the full `contributors` parameter:

| Name | Type | Description |
| ---- | ---- | ---- |
| name | `string` | Contributor's name |
| email | `string` | Contributor's email |
| avatar | `string` | Contributor's avatar URL, obtained through gravatar based on email |
| count | `number` | Number of contributions |

## Configuration / Options

In your project (wether theme or addon)

```ts
export default defineValaxyConfig<ThemeConfig>({
  addons: [
    addonGitLog({
      debug: false,
      contributor: {
        mode: 'log',
        // logArgs: '--first-parent --follow',
      },
    }),
  ],
})
```

| Name | Type | Default | Description |
| ---- | ---- | ---- | ---- |
| repositoryUrl | `string` | `undefined` | The URL of the repository. |
| contributor.mode | `'api'` \| `'log'` \| `'shortLog'` | `'api'` | The method to generate Git information. |
| contributor.logArgs | `string` | `''` | Additional arguments for `git log` command. |
| debug | `boolean` | `undefined` | Enable debug mode. |

Besides the `api` method, the `mode` option also includes `log` and `shortLog` methods. These methods allow you to generate Git information during build time, with the `git log` command by default adding the `--no-merges` parameter.

> [!WARNING]
> If you use the `log` or `shortLog` method to deploy projects on static servers (such as `Netlify`, `Vercel`), there may be restrictions. To ensure proper deployment on these platforms, please use the `api` method.

## FAQ

### Why does `shortLog` have no git information?

The 'git shortlog' command requires reading some content from standard input. This plugin uses '/dev/tty' by default to obtain the controlling terminal device of the current process, serving as the input or output device. However, on static servers such as Vercel, these '/dev/tty' or Node.js's 'options.stdio' are restricted, leading to issues.
