const KEYBOARD_ROWS = [
  /^[qwertyuiop]+$/,
  /^[asdfghjkl]+$/,
  /^[zxcvbnm]+$/,
]

function isGibberish(text: string): boolean {
  const t = text.trim().toLowerCase()
  if (!t) return false

  // All numbers or symbols — no letters at all
  if (/^[^a-z]+$/.test(t)) return true

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
    errors.product = 'Product is required.'
  } else if (p.length < 2) {
    errors.product = 'Product name is too short.'
  } else if (isGibberish(p)) {
    errors.product = 'Please enter a real product name.'
  }

  const o = objective.trim()
  if (!o) {
    errors.objective = 'Objective is required.'
  } else if (o.length < 4) {
    errors.objective = 'Objective is too short.'
  } else if (isGibberish(o)) {
    errors.objective = 'Please enter a real objective.'
  }

  const badSegs = segments
    .map((s) => {
      const t = s.trim()
      if (t.length < 2) return `"${t}" is too short`
      if (isGibberish(t)) return `"${t}" doesn't look valid`
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
    if (v.length < 2) return 'Too short.'
    if (isGibberish(v)) return 'Doesn\'t look like a real product.'
  }
  if (field === 'objective') {
    if (!v) return null
    if (v.length < 4) return 'Too short.'
    if (isGibberish(v)) return 'Doesn\'t look like a real objective.'
  }
  if (field === 'segment') {
    if (!v) return null
    if (v.length < 2) return 'Too short.'
    if (isGibberish(v)) return 'Doesn\'t look like a valid segment.'
  }
  return null
}
