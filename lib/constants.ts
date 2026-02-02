export const PLAN_CREDITS: Record<string, number> = {
  FREE: 5,
  STARTER: 50,
  PRO: 200,
  ENTERPRISE: 1000,
};

export const ARTICLE_CREDIT_COST = 25;

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
