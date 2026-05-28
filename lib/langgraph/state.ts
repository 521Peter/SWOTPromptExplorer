import { Annotation } from '@langchain/langgraph'

export const InsightState = Annotation.Root({
  // Input
  product: Annotation<string>(),
  objective: Annotation<string>(),
  segment: Annotation<string>(),
  provider: Annotation<string>(),

  // Output — each node writes its own key
  marketingOKRs: Annotation<string>(),
  strengths: Annotation<string>(),
  weaknesses: Annotation<string>(),
  opportunities: Annotation<string>(),
  threats: Annotation<string>(),
  marketPositioning: Annotation<string>(),
  buyerPersona: Annotation<string>(),
  investmentOpportunities: Annotation<string>(),
  channelsDistribution: Annotation<string>(),
})
