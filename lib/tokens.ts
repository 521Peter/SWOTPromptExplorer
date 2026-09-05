export const tokens = {
  // 背景色
  bg: '#0A0A0F',
  surface: '#13131A',
  border: '#1E1E2E',

  // 服务商徽标颜色
  providers: {
    claude: '#D97706',
    openai: '#10B981',
    groq: '#8B5CF6',
    openrouter: '#EC4899',
    glm: '#2563EB',
  },

  // 因果关系边的颜色（参见 ARCHITECTURE.md 第 11 节）
  edges: {
    amplifies: '#EF4444',  // 红色
    informs: '#3B82F6',    // 蓝色
    shapes: '#8B5CF6',     // 紫色
    enables: '#10B981',    // 绿色
    activates: '#F97316',  // 橙色
  },
} as const

export type Provider = keyof typeof tokens.providers
export type EdgeRelation = keyof typeof tokens.edges
