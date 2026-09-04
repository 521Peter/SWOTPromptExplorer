import type { Provider } from "./providers"

type Release = () => void

type ConcurrencyQueue = {
  active: number
  waiting: Release[]
}

const globalForLLMConcurrency = globalThis as typeof globalThis & {
  __swotLLMConcurrencyQueues?: Map<string, ConcurrencyQueue>
}

const queues = (globalForLLMConcurrency.__swotLLMConcurrencyQueues ??= new Map())

function getLimit(provider: Provider): number {
  if (provider !== "glm") return Number.POSITIVE_INFINITY

  const raw =
    process.env.DEFAULT_GLM_MAX_CONCURRENCY ||
    process.env.LLM_MAX_CONCURRENCY
  const parsed = Number(raw)

  if (!raw || Number.isNaN(parsed)) return 2
  return Math.max(1, Math.floor(parsed))
}

function getQueue(key: string): ConcurrencyQueue {
  const existing = queues.get(key)
  if (existing) return existing

  const queue = { active: 0, waiting: [] }
  queues.set(key, queue)
  return queue
}

export function withProviderConcurrency<T>(
  provider: Provider,
  task: () => Promise<T>,
): Promise<T> {
  const limit = getLimit(provider)
  if (limit === Number.POSITIVE_INFINITY) return task()

  const key = provider
  const queue = getQueue(key)

  return new Promise<T>((resolve, reject) => {
    const run = () => {
      queue.active += 1
      task().then(resolve, reject).finally(() => {
        queue.active -= 1
        queue.waiting.shift()?.()
      })
    }

    if (queue.active < limit) {
      run()
      return
    }

    queue.waiting.push(run)
  })
}
