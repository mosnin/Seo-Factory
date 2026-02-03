export const PLAN_CREDITS: Record<string, number> = {
  FREE: 10,
  STARTER: 50,
  PRO: 150,
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

/* ---------- Stripe plans ---------- */

export const PLANS = {
  FREE: {
    name: "Free",
    price: 0,
    credits: 10,
    description: "10 trial credits to get started",
    features: ["10 trial credits", "1 article/month", "1 brand voice", "Basic SEO optimization"],
  },
  STARTER: {
    name: "Starter",
    price: 99,
    credits: 50,
    description: "50 credits/month for growing businesses",
    features: ["50 credits/month", "10 articles/month", "3 brand voices", "Full SEO optimization", "Fact-checking & citations"],
  },
  PRO: {
    name: "Pro",
    price: 249,
    credits: 150,
    description: "150 credits/month for content teams",
    features: ["150 credits/month", "50 articles/month", "10 brand voices", "Full SEO optimization", "Fact-checking & citations", "Priority generation"],
  },
} as const;

export type PlanKey = keyof typeof PLANS;

/* ---------- Credit packs ---------- */

export const CREDIT_PACKS = [
  { credits: 50, price: 125, label: "50 Credits", priceLabel: "$125" },
  { credits: 100, price: 225, label: "100 Credits", priceLabel: "$225" },
] as const;

/* ---------- Stripe price ID mapping ---------- */
// These should match your Stripe dashboard price IDs.
// Set them as environment variables in production.

export const STRIPE_PRICE_IDS: Record<string, string> = {
  STARTER: process.env.STRIPE_PRICE_STARTER ?? "price_starter_monthly",
  PRO: process.env.STRIPE_PRICE_PRO ?? "price_pro_monthly",
  CREDIT_50: process.env.STRIPE_PRICE_CREDIT_50 ?? "price_credit_50",
  CREDIT_100: process.env.STRIPE_PRICE_CREDIT_100 ?? "price_credit_100",
};

export const PRICE_TO_PLAN: Record<string, string> = {
  [STRIPE_PRICE_IDS.STARTER]: "STARTER",
  [STRIPE_PRICE_IDS.PRO]: "PRO",
};

export const PRICE_TO_CREDITS: Record<string, number> = {
  [STRIPE_PRICE_IDS.CREDIT_50]: 50,
  [STRIPE_PRICE_IDS.CREDIT_100]: 100,
};
