import { anthropic } from "./claude";
import { prisma } from "./prisma";
import { slugify } from "./utils";
import { calculateReadability, calculateKeywordDensity } from "./readability";
import { ARTICLE_CREDIT_COST } from "./constants";

interface SeoMetadata {
  title: string;
  metaDescription: string;
}

interface SchemaMarkup {
  "@context": string;
  "@type": string;
  headline: string;
  datePublished: string;
  dateModified: string;
  author: { "@type": string; name: string };
  wordCount: number;
  description: string;
}

interface OptimizationResult {
  title: string;
  slug: string;
  metaDescription: string;
  wordCount: number;
  readabilityScore: number;
  seoScore: number;
  keywordDensity: number;
  eeatScore: number;
  schemaMarkup: SchemaMarkup;
  generationTimeSec: number;
}

// ── 1. SEO Metadata Generation ──────────────────────────────────────────────

async function generateSeoMetadata(
  keyword: string,
  contentMarkdown: string
): Promise<SeoMetadata> {
  // Take first 500 chars as context for the prompt
  const contentPreview = contentMarkdown.slice(0, 500);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `Generate SEO title (max 60 chars) and meta description (max 160 chars) for this article about "${keyword}". Make it compelling with a clear value proposition.

Article preview:
${contentPreview}

Output ONLY valid JSON — no markdown fences, no explanation:
{
  "title": "SEO optimized title here",
  "meta_description": "Compelling meta description here"
}`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude for SEO metadata");
  }

  let jsonText = textBlock.text.trim();
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  const parsed = JSON.parse(jsonText) as {
    title: string;
    meta_description: string;
  };

  return {
    title: parsed.title.slice(0, 60),
    metaDescription: parsed.meta_description.slice(0, 160),
  };
}

// ── 2. Schema Markup Generation ─────────────────────────────────────────────

function generateSchemaMarkup(
  title: string,
  description: string,
  wordCount: number,
  authorName: string
): SchemaMarkup {
  const now = new Date().toISOString();

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    datePublished: now,
    dateModified: now,
    author: {
      "@type": "Person",
      name: authorName,
    },
    wordCount,
    description,
  };
}

// ── 3. Quality Metrics ──────────────────────────────────────────────────────

function calculateSeoScore(
  keywordDensity: number,
  hasTitle: boolean,
  hasMetaDescription: boolean,
  hasCitations: boolean,
  readabilityScore: number,
  wordCount: number,
  targetLength: number
): number {
  let score = 0;

  // Keyword density (0-20 points): ideal range 1-3%
  if (keywordDensity >= 1 && keywordDensity <= 3) {
    score += 20;
  } else if (keywordDensity > 0.5 && keywordDensity < 5) {
    score += 10;
  } else if (keywordDensity > 0) {
    score += 5;
  }

  // Title presence (0-15 points)
  if (hasTitle) score += 15;

  // Meta description (0-15 points)
  if (hasMetaDescription) score += 15;

  // Citations / E-E-A-T signal (0-15 points)
  if (hasCitations) score += 15;

  // Readability (0-20 points): aim for 50-70 (standard to fairly easy)
  if (readabilityScore >= 50 && readabilityScore <= 80) {
    score += 20;
  } else if (readabilityScore >= 30 && readabilityScore < 50) {
    score += 12;
  } else if (readabilityScore > 80) {
    score += 15;
  } else {
    score += 5;
  }

  // Content length vs target (0-15 points)
  const lengthRatio = wordCount / targetLength;
  if (lengthRatio >= 0.9 && lengthRatio <= 1.3) {
    score += 15;
  } else if (lengthRatio >= 0.7) {
    score += 10;
  } else if (lengthRatio >= 0.5) {
    score += 5;
  }

  return Math.min(100, score);
}

/**
 * E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) score.
 * Custom formula scaled to 0-10:
 *   (citations_count * 2) + (readability_score / 10) + (has_author_bio ? 20 : 0)
 *   Then scaled to fit 0-10.
 */
function calculateEeatScore(
  citationsCount: number,
  readabilityScore: number,
  hasAuthorBio: boolean
): number {
  const raw =
    citationsCount * 2 + readabilityScore / 10 + (hasAuthorBio ? 20 : 0);

  // Scale: max realistic score ~60 (20 citations * 2 + 100/10 + 20 = 70)
  // Map to 0-10 scale
  const scaled = Math.min(10, Math.round((raw / 7) * 10) / 10);

  return Math.max(0, scaled);
}

// ── 4. Main Optimization Pipeline ───────────────────────────────────────────

export async function optimizeArticle(
  articleId: string,
  jobStartTime: Date
): Promise<OptimizationResult> {
  const article = await prisma.article.findUniqueOrThrow({
    where: { id: articleId },
    include: {
      user: { select: { id: true, name: true } },
      _count: { select: { citations: true } },
    },
  });

  const contentMarkdown = article.contentMarkdown ?? "";
  const contentHtml = article.contentHtml ?? "";

  // 1. Generate SEO metadata via Claude
  const seoMetadata = await generateSeoMetadata(
    article.keyword,
    contentMarkdown
  );

  // 2. Calculate quality metrics
  const readabilityMetrics = calculateReadability(
    contentMarkdown || contentHtml
  );
  const keywordDensity = calculateKeywordDensity(
    contentMarkdown || contentHtml,
    article.keyword
  );

  const citationsCount = article._count.citations;

  const seoScore = calculateSeoScore(
    keywordDensity,
    !!seoMetadata.title,
    !!seoMetadata.metaDescription,
    citationsCount > 0,
    readabilityMetrics.fleschReadingEase,
    readabilityMetrics.wordCount,
    article.targetLength
  );

  const eeatScore = calculateEeatScore(
    citationsCount,
    readabilityMetrics.fleschReadingEase,
    !!article.user.name
  );

  // 3. Generate schema markup
  const schemaMarkup = generateSchemaMarkup(
    seoMetadata.title,
    seoMetadata.metaDescription,
    readabilityMetrics.wordCount,
    article.user.name ?? "SEO Factory"
  );

  const slug = slugify(seoMetadata.title);

  // 4. Calculate generation time
  const generationTimeSec = Math.round(
    (Date.now() - jobStartTime.getTime()) / 1000
  );

  // 5. Update article with all optimization data
  await prisma.article.update({
    where: { id: articleId },
    data: {
      title: seoMetadata.title,
      slug,
      metaDescription: seoMetadata.metaDescription,
      wordCount: readabilityMetrics.wordCount,
      readabilityScore: readabilityMetrics.fleschReadingEase,
      seoScore,
      keywordDensity,
      eeatScore,
      citationsCount,
      schemaMarkupJson: JSON.parse(JSON.stringify(schemaMarkup)),
      generationTimeSec,
      status: "READY",
    },
  });

  // 6. Record credit usage transaction for the optimization step
  await prisma.creditTransaction.create({
    data: {
      userId: article.userId,
      amount: -ARTICLE_CREDIT_COST,
      type: "USAGE",
      referenceId: articleId,
      description: `Optimization complete: ${article.keyword}`,
    },
  });

  await prisma.user.update({
    where: { id: article.userId },
    data: { creditsBalance: { decrement: ARTICLE_CREDIT_COST } },
  });

  return {
    title: seoMetadata.title,
    slug,
    metaDescription: seoMetadata.metaDescription,
    wordCount: readabilityMetrics.wordCount,
    readabilityScore: readabilityMetrics.fleschReadingEase,
    seoScore,
    keywordDensity,
    eeatScore,
    schemaMarkup,
    generationTimeSec,
  };
}
