const KEYBOARD_ROWS = [
  /^[qwertyuiop]+$/,
  /^[asdfghjkl]+$/,
  /^[zxcvbnm]+$/,
]

function isGibberish(text: string): boolean {
  const t = text.trim().toLowerCase()
  if (!t) return false

  // Chinese and other Unicode letters are valid input; reject values with no letters.
  if (!/\p{L}/u.test(t)) return true

  // 5+ consecutive consonants (e.g. "strngth" is ok, "bdfghjk" is not)
  if (/[bcdfghjklmnpqrstvwxyz]{6,}/.test(t.replace(/\s/g, ''))) return true

  // Single keyboard row mash longer than 4 chars
  const noSpace = t.replace(/\s/g, '')
  if (noSpace.length > 4 && KEYBOARD_ROWS.some((r) => r.test(noSpace))) return true

  // Repeated character (e.g. "aaaaa", "hhhhhh")
  if (/(.)\1{4,}/.test(t)) return true

  // Repeating short pattern (e.g. "ososos", "ababab", "xoxoxo")
  if (/^(.{1,3})\1{2,}$/.test(noSpace) && noSpace.length >= 4) return true

  // Vowel ratio check for longer inputs — real words are ~20–60% vowels
  const letters = t.replace(/[^a-z]/g, '')
  if (letters.length >= 7) {
    const vowelRatio = (letters.match(/[aeiou]/g) ?? []).length / letters.length
    if (vowelRatio < 0.07) return true
  }

  return false
}

export interface ValidationErrors {
  product?: string
  objective?: string
  segments?: string[]
}

export function validateForm(
  product: string,
  objective: string,
  segments: string[]
): ValidationErrors {
  const errors: ValidationErrors = {}

  const p = product.trim()
  if (!p) {
    errors.product = '请填写产品名称。'
  } else if (p.length < 2) {
    errors.product = '产品名称太短。'
  } else if (isGibberish(p)) {
    errors.product = '请输入有效的产品名称。'
  }

  const o = objective.trim()
  if (!o) {
    errors.objective = '请填写分析目标。'
  } else if (o.length < 2) {
    errors.objective = '分析目标太短。'
  } else if (isGibberish(o)) {
    errors.objective = '请输入有效的业务目标。'
  }

  const badSegs = segments
    .map((s) => {
      const t = s.trim()
      if (t.length < 2) return `“${t}”太短`
      if (isGibberish(t)) return `“${t}”不是有效的客户群体`
      return null
    })
    .filter(Boolean) as string[]

  if (badSegs.length) errors.segments = badSegs

  return errors
}

export function hasErrors(e: ValidationErrors) {
  return !!(e.product || e.objective || (e.segments && e.segments.length > 0))
}

export function validateField(field: 'product' | 'objective' | 'segment', value: string): string | null {
  const v = value.trim()
  if (field === 'product') {
    if (!v) return null // empty is fine until run
    if (v.length < 2) return '产品名称太短。'
    if (isGibberish(v)) return '请输入有效的产品名称。'
  }
  if (field === 'objective') {
    if (!v) return null
    if (v.length < 2) return '分析目标太短。'
    if (isGibberish(v)) return '请输入有效的业务目标。'
  }
  if (field === 'segment') {
    if (!v) return null
    if (v.length < 2) return '客户群体名称太短。'
    if (isGibberish(v)) return '请输入有效的客户群体。'
  }
  return null
}
