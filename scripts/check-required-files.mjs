// Verifies every local file referenced by index.html (src, srcset, href) exists before publish.
import fs from 'node:fs'
import path from 'node:path'
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
const refs = new Set(['index.html', 'styles.css', 'main.js', 'favicon.svg', 'vercel.json', 'pines.svg'])
for (const m of html.matchAll(/(?:src|href|srcset|imagesrcset|content)="([^"]+)"/g)) {
  for (const part of m[1].split(',')) {
    const u = part.trim().split(/\s+/)[0]
    if (!u || /^(https?:|mailto:|tel:|#|data:)/.test(u) || !/\.[a-z0-9]+$/i.test(u)) continue
    refs.add(u.replace(/^\.?\//, ''))
  }
}
const missing = [...refs].filter(p => !fs.existsSync(path.join(root, p)))
if (missing.length) { console.error('Missing required file(s):'); missing.forEach(p => console.error('  -', p)); process.exit(1) }
console.log(`Required files OK (${refs.size} checked).`)
