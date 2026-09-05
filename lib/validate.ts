const KEYBOARD_ROWS = [
  /^[qwertyuiop]+$/,
  /^[asdfghjkl]+$/,
  /^[zxcvbnm]+$/,
]

function isGibberish(text: string): boolean {
  const t = text.trim().toLowerCase()
  if (!t) return false

  // 中文及其他 Unicode 字母均为有效输入；拒绝不含任何字母的值。
  if (!/\p{L}/u.test(t)) return true

  // 连续出现 5 个以上辅音（例如“strngth”可以，“bdfghjk”不可以）
  if (/[bcdfghjklmnpqrstvwxyz]{6,}/.test(t.replace(/\s/g, ''))) return true

  // 同一键盘行上连续乱按超过 4 个字符
  const noSpace = t.replace(/\s/g, '')
  if (noSpace.length > 4 && KEYBOARD_ROWS.some((r) => r.test(noSpace))) return true

  // 重复字符（例如“aaaaa”“hhhhhh”）
  if (/(.)\1{4,}/.test(t)) return true

  // 重复的短模式（例如“ososos”“ababab”“xoxoxo”）
  if (/^(.{1,3})\1{2,}$/.test(noSpace) && noSpace.length >= 4) return true

  // 对较长输入检查元音比例，真实单词中的元音通常约占 20%～60%
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
    if (!v) return null // 运行前允许为空
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
