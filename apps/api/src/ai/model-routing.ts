/**
 * Model routing constants for LifeOS AI (Phase 2)
 * See AI_PROMPTS_AND_ROUTING.md
 */
export const AI_MODELS = {
  FAST: 'gpt-4o-mini',   // parse/extract - fallback until gpt-5-nano
  CHAT: 'gpt-4o-mini',   // short friendly copy
  INSIGHT: 'gpt-4o',     // weekly summaries
} as const;
