import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

// Files from public/ that make up the installable app shell (audio is cached on demand).
const PUBLIC_SHELL = [
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png',
  'icons/favicon-64.png',
]

// Emits sw.js with the list of built files to precache, so the app works offline.
function serviceWorker(): Plugin {
  return {
    name: 'chn-service-worker',
    apply: 'build',
    generateBundle(_options, bundle) {
      const built = Object.keys(bundle).filter((f) => !f.endsWith('.map'))
      const precache = ['./', 'index.html', ...built.filter((f) => f !== 'index.html'), ...PUBLIC_SHELL]
      const version = createHash('sha256').update(built.sort().join('|')).digest('hex').slice(0, 12)
      const source = readFileSync(new URL('./sw.template.js', import.meta.url), 'utf8')
        .replace('__VERSION__', version)
        .replace('__PRECACHE__', JSON.stringify(precache, null, 2))
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    serviceWorker(),
  ],
  server: {
    host: true,
    port: 5173,
  },
})
