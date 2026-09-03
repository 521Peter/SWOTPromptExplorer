export const tokens = {
  // Backgrounds
  bg: '#0A0A0F',
  surface: '#13131A',
  border: '#1E1E2E',

  // Provider badge colors
  providers: {
    claude: '#D97706',
    openai: '#10B981',
    groq: '#8B5CF6',
    openrouter: '#EC4899',
    glm: '#2563EB',
  },

  // Causal edge colors (ARCHITECTURE.md Section 11)
  edges: {
    amplifies: '#EF4444',  // red
    informs: '#3B82F6',    // blue
    shapes: '#8B5CF6',     // purple
    enables: '#10B981',    // green
    activates: '#F97316',  // orange
  },
} as const

export type Provider = keyof typeof tokens.providers
export type EdgeRelation = keyof typeof tokens.edges
