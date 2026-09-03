import type { BaseMessage } from '@langchain/core/messages'

export function messageContentToText(content: BaseMessage['content']): string {
  if (typeof content === 'string') return content

  return content
    .map((part) => {
      if (typeof part === 'string') return part
      return part.type === 'text' && typeof part.text === 'string' ? part.text : ''
    })
    .join('')
}

function findCompleteJsonObject(text: string): string | null {
  const start = text.indexOf('{')
  if (start === -1) return null

  let depth = 0
  let inString = false
  let escaped = false

  for (let index = start; index < text.length; index++) {
    const char = text[index]

    if (inString) {
      if (escaped) escaped = false
      else if (char === '\\') escaped = true
      else if (char === '"') inString = false
      continue
    }

    if (char === '"') inString = true
    else if (char === '{') depth++
    else if (char === '}' && --depth === 0) return text.slice(start, index + 1)
  }

  return null
}

export function parseJsonResponse<T>(content: BaseMessage['content'], context: string): T {
  const text = messageContentToText(content).trim()
  if (!text) {
    throw new Error(`${context}：模型返回了空内容，可能是推理过程耗尽了输出 token`)
  }

  const json = findCompleteJsonObject(text)
  if (!json) {
    throw new Error(`${context}：模型返回了不完整的 JSON，可能触发了输出长度限制`)
  }

  try {
    return JSON.parse(json) as T
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    throw new Error(`${context}：JSON 格式无效（${reason}）`)
  }
}
