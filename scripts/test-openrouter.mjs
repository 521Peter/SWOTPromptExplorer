/**
 * End-to-end test for the /api/insights route using OpenRouter.
 * Run from the project root while `npm run dev` is running:
 *   node scripts/test-openrouter.mjs
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load key from .env.local
function loadKey() {
  try {
    const env = readFileSync(resolve(__dirname, '../.env.local'), 'utf8')
    const match = env.match(/NEXT_PUBLIC_DEFAULT_OPENROUTER_KEY=(.+)/)
    return match?.[1]?.trim() ?? ''
  } catch {
    return process.env.NEXT_PUBLIC_DEFAULT_OPENROUTER_KEY ?? ''
  }
}

const key = loadKey()
if (!key) {
  console.error('No OpenRouter key found in .env.local')
  process.exit(1)
}

const payload = {
  product: 'Electric Cars',
  objective: 'Increase market awareness',
  segment: 'Early Adopters',
  provider: 'openrouter',
  keys: {
    openrouter: key,
    openrouterModel: 'openai/gpt-4o-mini',
  },
}

console.log('Sending request to /api/insights...')
console.log(`  product:  ${payload.product}`)
console.log(`  segment:  ${payload.segment}`)
console.log(`  provider: ${payload.provider} (${payload.keys.openrouterModel})`)
console.log()

const start = Date.now()

const res = await fetch('http://localhost:3000/api/insights', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
})

const elapsed = ((Date.now() - start) / 1000).toFixed(1)

if (!res.ok) {
  const json = await res.json().catch(() => ({}))
  console.error(`HTTP ${res.status}: ${json.error}`)
  if (json.taskErrors) {
    console.error('Task errors:')
    json.taskErrors.forEach((e, i) => console.error(`  [${i}] ${e}`))
  }
  process.exit(1)
}

const data = await res.json()

console.log(`Response received in ${elapsed}s  (HTTP ${res.status})`)
console.log()

const insights = data.insights ?? {}
const keys = Object.keys(insights)

if (keys.length === 0) {
  console.warn('No insights in response:', JSON.stringify(data, null, 2))
  process.exit(1)
}

console.log(`Got ${keys.length} insight(s):\n`)
for (const [k, v] of Object.entries(insights)) {
  const preview = String(v).slice(0, 200).replace(/\n/g, ' ')
  console.log(`  [${k}]`)
  console.log(`  ${preview}${v.length > 200 ? '…' : ''}`)
  console.log()
}

console.log('✓ Test passed')
