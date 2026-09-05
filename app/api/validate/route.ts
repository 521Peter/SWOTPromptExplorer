import { NextResponse } from 'next/server'

const MODELS = ['meta-llama/llama-3.2-3b-instruct:free', 'openai/gpt-4o-mini']

const PROMPT = (product: string, objective: string, segments: string[]) => `你是一名商业分析师，需要验证表单输入。请判断每项输入是真实、有意义的商业术语，还是乱码或无意义内容。中文和英文输入都应正常识别。

输入：
- product："${product}"
- objective："${objective}"
- segments：${JSON.stringify(segments)}

定义：
- 有效产品：真实的产品、服务、应用、品牌、公司或行业类别（例如“电动汽车”“Notion”“SaaS CRM”“Nike 鞋”）
- 有效目标：真实的业务目标（例如“提高品牌知名度”“将流失率降低 20%”）
- 有效客群：可识别的客户群体（例如“企业团队”“Z 世代消费者”“独立创业者”）
- 无效内容：随机字母、乱码（例如 "yywiwisis"、"asdfgh"）、键盘乱敲或无意义字符串

有效字段返回 "ok"，无效字段返回简短的简体中文错误提示。segments 为空时返回空数组。

只返回有效 JSON，不要使用 Markdown，也不要解释：
{"product":"ok","objective":"ok","segments":[]}`

async function callModel(model: string, product: string, objective: string, segments: string[], apiKey: string) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://swot-explorer.vercel.app',
      'X-Title': 'SWOT Prompt Explorer',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: PROMPT(product, objective, segments) }],
      max_tokens: 128,
      temperature: 0,
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    let msg = `OpenRouter ${res.status}`
    try { msg = JSON.parse(text)?.error?.message ?? msg } catch { /* 忽略 */ }
    throw new Error(msg)
  }
  const data = await res.json()
  const raw: string = data.choices?.[0]?.message?.content ?? ''
  const match = raw.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('模型响应中没有 JSON')
  return JSON.parse(match[0]) as { product: string; objective: string; segments: string[] }
}

export async function POST(req: Request) {
  let body: { product?: string; objective?: string; segments?: string[]; openrouterKey?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: '请求内容不是有效的 JSON' }, { status: 400 })
  }

  const { product = '', objective = '', segments = [], openrouterKey } = body
  const apiKey = openrouterKey || process.env.DEFAULT_OPENROUTER_KEY
  if (!apiKey) return NextResponse.json({ error: '需要 OpenRouter API Key。' }, { status: 400 })

  let result: { product: string; objective: string; segments: string[] } | null = null
  let lastError = '输入校验失败'

  for (const model of MODELS) {
    try {
      result = await callModel(model, product, objective, segments, apiKey)
      break
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err)
      console.error(`[/api/validate] ${model} failed:`, lastError)
    }
  }

  if (!result) return NextResponse.json({ error: lastError }, { status: 500 })

  // 构建字段级错误；任何非“ok”的内容都视为错误消息
  const errors: { product?: string; objective?: string; segments?: string[] } = {}
  if (product !== '__trusted__' && result.product && result.product !== 'ok')
    errors.product = `“${product}”不像有效产品，请输入真实的产品名称。`
  if (objective !== '__trusted__' && result.objective && result.objective !== 'ok')
    errors.objective = `“${objective}”不像有效目标，请输入真实的业务目标。`
  const segErrors = (result.segments ?? [])
    .map((s, i) => s !== 'ok' ? `“${segments[i]}”不像有效的客户群体。` : null)
    .filter(Boolean) as string[]
  if (segErrors.length) errors.segments = segErrors

  return NextResponse.json({ valid: Object.keys(errors).length === 0, errors })
}
