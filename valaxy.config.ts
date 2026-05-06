import { defineValaxyConfig } from 'valaxy'
import { GitLogVitePlugins } from './plugins/main'

export default defineValaxyConfig({
  vite: {
    plugins: [
      ...GitLogVitePlugins,
    ],
  },
})
