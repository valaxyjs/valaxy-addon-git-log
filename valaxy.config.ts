import { defineTheme } from 'valaxy'
import { GitLogVitePlugins } from './plugins/main'

export default defineTheme({
  vite: {
    plugins: [
      ...GitLogVitePlugins,
    ],
  },
})
