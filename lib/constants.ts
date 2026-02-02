export const PLAN_CREDITS: Record<string, number> = {
  FREE: 5,
  STARTER: 50,
  PRO: 200,
  ENTERPRISE: 1000,
};

export const ARTICLE_CREDIT_COST = 25;

export const LENGTH_PRESETS = {
  short: { label: "Short", range: "500-1000 words", minWords: 500, maxWords: 1000, targetLength: 750, credits: 1 },
  medium: { label: "Medium", range: "1000-2000 words", minWords: 1000, maxWords: 2000, targetLength: 1500, credits: 2 },
  long: { label: "Long", range: "2000-3000 words", minWords: 2000, maxWords: 3000, targetLength: 2500, credits: 3 },
} as const;

export type LengthPreset = keyof typeof LENGTH_PRESETS;

export const PLAN_LIMITS = {
  FREE: {
    articlesPerMonth: 1,
    brandVoices: 1,
  },
  STARTER: {
    articlesPerMonth: 10,
    brandVoices: 3,
  },
  PRO: {
    articlesPerMonth: 50,
    brandVoices: 10,
  },
  ENTERPRISE: {
    articlesPerMonth: -1, // unlimited
    brandVoices: -1,
  },
} as const;
