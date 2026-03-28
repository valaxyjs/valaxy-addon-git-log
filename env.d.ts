export {}

declare module 'valaxy' {
  import type { ComputedRef } from 'vue'

  interface ValaxyAddon<AddonOptions = Record<string, any>> {
    name: string
    global?: boolean
    props?: Record<string, any>
    options?: AddonOptions
  }

  interface RuntimeConfig {
    addons: Record<string, ValaxyAddon>
  }

  export function useFrontmatter<T extends Record<string, any> = Record<string, any>>(): ComputedRef<T>
  export function useRuntimeConfig(): ComputedRef<RuntimeConfig>
}
