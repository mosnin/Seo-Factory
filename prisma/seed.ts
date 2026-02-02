import { PrismaClient, PlanTier, ArticleStatus, CreditTransactionType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.articleCitation.deleteMany();
  await prisma.creditTransaction.deleteMany();
  await prisma.article.deleteMany();
  await prisma.brandVoice.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.serpCache.deleteMany();
  await prisma.user.deleteMany();

  // Create test user
  const user = await prisma.user.create({
    data: {
      cognitoSub: "00000000-0000-0000-0000-000000000000",
      email: "test@seofactory.dev",
      name: "Test User",
      planTier: PlanTier.PRO,
      creditsBalance: 150,
      onboardingCompleted: true,
    },
  });

  console.log(`Created user: ${user.email} (${user.id})`);

  // Create subscription
  const subscription = await prisma.subscription.create({
    data: {
      userId: user.id,
      stripeCustomerId: "cus_test_123456",
      stripeSubscriptionId: "sub_test_123456",
      stripePriceId: "price_test_pro_monthly",
      stripeCurrentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`Created subscription: ${subscription.stripeSubscriptionId}`);

  // Create brand voices
  const professionalVoice = await prisma.brandVoice.create({
    data: {
      userId: user.id,
      name: "Professional Tech",
      tone: "authoritative, clear, data-driven",
      pointOfView: "first-person plural (we)",
      exemplarContent:
        "We analyzed over 10,000 search results to uncover the patterns that consistently drive organic traffic. Our findings reveal three actionable strategies that any team can implement today.",
      guidelines:
        "Avoid jargon unless defined. Use data to support claims. Keep sentences under 25 words where possible.",
    },
  });

  const casualVoice = await prisma.brandVoice.create({
    data: {
      userId: user.id,
      name: "Casual Blog",
      tone: "friendly, conversational, approachable",
      pointOfView: "second-person (you)",
      exemplarContent:
        "Ever wonder why some blog posts rank on page one while yours is stuck on page five? You're not alone. Let's break down what actually works in SEO right now.",
      guidelines:
        "Use contractions. Ask rhetorical questions. Include personal anecdotes where relevant.",
    },
  });

  console.log(`Created ${2} brand voices`);

  // Create articles
  const publishedArticle = await prisma.article.create({
    data: {
      userId: user.id,
      keyword: "best project management tools 2025",
      title: "12 Best Project Management Tools in 2025: A Data-Driven Comparison",
      slug: "best-project-management-tools-2025",
      status: ArticleStatus.PUBLISHED,
      contentMarkdown:
        "# 12 Best Project Management Tools in 2025\n\nManaging projects efficiently requires the right tools...",
      contentHtml:
        "<h1>12 Best Project Management Tools in 2025</h1><p>Managing projects efficiently requires the right tools...</p>",
      metaDescription:
        "Compare the 12 best project management tools of 2025. We tested each platform across 8 criteria including pricing, features, and team size fit.",
      wordCount: 2847,
      readabilityScore: 72.5,
      seoScore: 91.0,
      brandVoiceId: professionalVoice.id,
    },
  });

  const writingArticle = await prisma.article.create({
    data: {
      userId: user.id,
      keyword: "how to start a saas business",
      title: "How to Start a SaaS Business: The Complete Guide",
      slug: "how-to-start-saas-business",
      status: ArticleStatus.WRITING,
      brandVoiceId: casualVoice.id,
    },
  });

  const queuedArticle = await prisma.article.create({
    data: {
      userId: user.id,
      keyword: "remote team communication tools",
      status: ArticleStatus.QUEUED,
    },
  });

  console.log(`Created ${3} articles`);

  // Create citations for the published article
  await prisma.articleCitation.createMany({
    data: [
      {
        articleId: publishedArticle.id,
        claimText: "Monday.com serves over 186,000 customers worldwide",
        sourceUrl: "https://monday.com/blog/company-updates/",
        confidence: 0.92,
      },
      {
        articleId: publishedArticle.id,
        claimText: "Asana reported 139,000 paying customers in Q4 2024",
        sourceUrl: "https://investors.asana.com/quarterly-results",
        confidence: 0.88,
      },
      {
        articleId: publishedArticle.id,
        claimText: "Teams using project management tools report 28% higher productivity",
        sourceUrl: "https://www.pmi.org/learning/thought-leadership/pulse",
        confidence: 0.75,
      },
    ],
  });

  console.log(`Created ${3} article citations`);

  // Create credit transactions
  await prisma.creditTransaction.createMany({
    data: [
      {
        userId: user.id,
        amount: 200,
        type: CreditTransactionType.PURCHASE,
        referenceId: subscription.id,
        description: "Pro plan monthly credit allocation",
      },
      {
        userId: user.id,
        amount: -25,
        type: CreditTransactionType.USAGE,
        referenceId: publishedArticle.id,
        description: "Article generation: best project management tools 2025",
      },
      {
        userId: user.id,
        amount: -25,
        type: CreditTransactionType.USAGE,
        referenceId: writingArticle.id,
        description: "Article generation: how to start a saas business",
      },
    ],
  });

  console.log(`Created ${3} credit transactions`);

  // Create SERP cache entries
  await prisma.serpCache.createMany({
    data: [
      {
        keyword: "best project management tools 2025",
        results: JSON.parse(
          JSON.stringify({
            organic: [
              { position: 1, url: "https://www.pcmag.com/picks/the-best-project-management-software", title: "The Best Project Management Software" },
              { position: 2, url: "https://www.forbes.com/advisor/business/software/best-project-management-software/", title: "Best Project Management Software Of 2025" },
              { position: 3, url: "https://clickup.com/blog/project-management-tools/", title: "Top Project Management Tools" },
            ],
            peopleAlsoAsk: [
              "What is the best project management tool in 2025?",
              "Is Monday better than Asana?",
              "What project management tool do most companies use?",
            ],
            searchVolume: 12100,
          })
        ),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        keyword: "how to start a saas business",
        results: JSON.parse(
          JSON.stringify({
            organic: [
              { position: 1, url: "https://www.shopify.com/blog/how-to-start-a-saas-company", title: "How to Start a SaaS Company" },
              { position: 2, url: "https://www.forbes.com/advisor/business/how-to-start-saas-company/", title: "How To Start A SaaS Company In 2025" },
            ],
            peopleAlsoAsk: [
              "How much does it cost to start a SaaS business?",
              "Can one person build a SaaS?",
            ],
            searchVolume: 8400,
          })
        ),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log(`Created ${2} SERP cache entries`);

  console.log("\nSeed completed successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
