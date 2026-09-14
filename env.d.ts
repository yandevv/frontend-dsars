/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base das chamadas à API — `/api` atrás do proxy. */
  readonly VITE_API_BASE: string
  /** Slug da organização controladora atendida por este portal. */
  readonly VITE_ORGANIZATION_SLUG: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
