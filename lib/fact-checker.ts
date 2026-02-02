import { anthropic } from "./claude";
import { prisma } from "./prisma";

const MAX_CITATIONS_PER_ARTICLE = 20;
const CONFIDENCE_THRESHOLD = 7;
const CONTEXT_CHARS = 100;

interface ClaimMarker {
  fullMatch: string;
  claimText: string;
  startIndex: number;
}

interface VerifiedCitation {
  claimText: string;
  sourceUrl: string;
  sourceTitle: string;
  confidence: number;
}

interface FactCheckResult {
  finalContent: string;
  citations: VerifiedCitation[];
  unresolvedCount: number;
}

/**
 * Parse [^citation_needed] markers from article content.
 * Extracts ~100 chars before and after each marker as claim context.
 */
function parseMarkers(content: string): ClaimMarker[] {
  const markers: ClaimMarker[] = [];
  const regex = /\[\^citation_needed\]/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (markers.length >= MAX_CITATIONS_PER_ARTICLE) break;

    const start = Math.max(0, match.index - CONTEXT_CHARS);
    const end = Math.min(
      content.length,
      match.index + match[0].length + CONTEXT_CHARS
    );

    const before = content.slice(start, match.index).trim();
    const after = content
      .slice(match.index + match[0].length, end)
      .trim();
    const claimText = `${before} ${after}`.trim();

    markers.push({
      fullMatch: match[0],
      claimText,
      startIndex: match.index,
    });
  }

  return markers;
}

/**
 * Use Claude with the web_search tool to find an authoritative source
 * for a given claim, then evaluate confidence.
 */
async function verifyClaim(
  claimText: string
): Promise<VerifiedCitation | null> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 3,
      },
    ],
    messages: [
      {
        role: "user",
        content: `You are a fact-checker. Search the web to find an authoritative source that supports or relates to the following claim:

"${claimText}"

Search for: "${claimText} authoritative source"

After searching, evaluate the best source you found. Return ONLY valid JSON with no markdown fences:
{
  "source_url": "https://...",
  "source_title": "Title of the page or article",
  "confidence_score": <number 1-10>
}

Confidence scoring guide:
- 9-10: Government, academic, or established institution source directly confirming the claim
- 7-8: Reputable news outlet, well-known industry publication, or expert source supporting the claim
- 4-6: Blog, forum, or less authoritative source with partial support
- 1-3: No good source found, or sources contradict the claim

If you cannot find any relevant source, return confidence_score of 1 with the best URL you found.`,
      },
    ],
  });

  // Extract text from the final response (after tool use)
  const textBlocks = message.content.filter((block) => block.type === "text");
  const lastText = textBlocks[textBlocks.length - 1];
  if (!lastText || lastText.type !== "text") {
    return null;
  }

  try {
    // Strip markdown fences if Claude includes them despite instructions
    let jsonText = lastText.text.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText
        .replace(/^```(?:json)?\n?/, "")
        .replace(/\n?```$/, "");
    }

    const result = JSON.parse(jsonText) as {
      source_url: string;
      source_title: string;
      confidence_score: number;
    };

    return {
      claimText,
      sourceUrl: result.source_url,
      sourceTitle: result.source_title,
      confidence: result.confidence_score,
    };
  } catch {
    return null;
  }
}

/**
 * Build a references section in markdown/HTML format.
 */
function buildCitationList(
  citations: VerifiedCitation[]
): string {
  if (citations.length === 0) return "";

  const lines = citations.map(
    (c, i) =>
      `${i + 1}. [${c.sourceTitle}](${c.sourceUrl})`
  );

  return `\n\n---\n\n## References\n\n${lines.join("\n")}`;
}

function buildCitationListHtml(
  citations: VerifiedCitation[]
): string {
  if (citations.length === 0) return "";

  const items = citations
    .map(
      (c, i) =>
        `<li id="cite-${i + 1}"><a href="${c.sourceUrl}" target="_blank" rel="noopener noreferrer">${c.sourceTitle}</a></li>`
    )
    .join("\n");

  return `\n<hr>\n<h2>References</h2>\n<ol>\n${items}\n</ol>`;
}

/**
 * Main fact-checking pipeline for an article.
 *
 * 1. Parse [^citation_needed] markers from content
 * 2. For each claim, use Claude web_search to find authoritative sources
 * 3. High-confidence citations replace markers with superscript links
 * 4. Low-confidence markers are kept and flagged for human review
 * 5. Appends reference list and persists citations to DB
 */
export async function factCheckArticle(
  articleId: string
): Promise<FactCheckResult> {
  const article = await prisma.article.findUniqueOrThrow({
    where: { id: articleId },
  });

  const contentMarkdown = article.contentMarkdown ?? "";
  const contentHtml = article.contentHtml ?? "";

  const markers = parseMarkers(contentMarkdown);

  if (markers.length === 0) {
    return { finalContent: contentMarkdown, citations: [], unresolvedCount: 0 };
  }

  const verifiedCitations: VerifiedCitation[] = [];
  const lowConfidenceClaims: VerifiedCitation[] = [];

  // Process claims sequentially to respect API rate limits and ordering
  for (const marker of markers) {
    const result = await verifyClaim(marker.claimText);

    if (result) {
      if (result.confidence >= CONFIDENCE_THRESHOLD) {
        verifiedCitations.push(result);
      } else {
        lowConfidenceClaims.push(result);
      }
    }
  }

  // Replace markers in content with superscript citation links
  let updatedMarkdown = contentMarkdown;
  let updatedHtml = contentHtml;
  let citationNumber = 0;

  // Track marker positions — process from end to start to preserve indices
  const sortedMarkers = [...markers].sort(
    (a, b) => b.startIndex - a.startIndex
  );

  for (const marker of sortedMarkers) {
    const verifiedIndex = verifiedCitations.findIndex(
      (c) => c.claimText === parseMarkers(contentMarkdown).find(
        (m) => m.startIndex === marker.startIndex
      )?.claimText
    );

    if (verifiedIndex !== -1) {
      citationNumber = verifiedIndex + 1;
      const supLink = `<sup>[<a href="#cite-${citationNumber}">${citationNumber}</a>]</sup>`;
      const supMarkdown = `[<sup>${citationNumber}</sup>](#cite-${citationNumber})`;

      // Replace the first occurrence of the marker starting from startIndex
      updatedMarkdown =
        updatedMarkdown.slice(0, marker.startIndex) +
        supMarkdown +
        updatedMarkdown.slice(marker.startIndex + marker.fullMatch.length);

      // Replace in HTML too (simple string replace for first occurrence)
      updatedHtml = updatedHtml.replace(
        "[^citation_needed]",
        supLink
      );
    }
    // Low-confidence markers stay as-is for human review
  }

  // Append citation list
  const citationListMarkdown = buildCitationList(verifiedCitations);
  const citationListHtml = buildCitationListHtml(verifiedCitations);

  updatedMarkdown += citationListMarkdown;
  updatedHtml += citationListHtml;

  // Persist citations to database
  const citationRecords = [
    ...verifiedCitations.map((c) => ({
      articleId,
      claimText: c.claimText,
      sourceUrl: c.sourceUrl,
      sourceTitle: c.sourceTitle,
      confidence: c.confidence,
      needsReview: false,
    })),
    ...lowConfidenceClaims.map((c) => ({
      articleId,
      claimText: c.claimText,
      sourceUrl: c.sourceUrl,
      sourceTitle: c.sourceTitle,
      confidence: c.confidence,
      needsReview: true,
    })),
  ];

  if (citationRecords.length > 0) {
    await prisma.articleCitation.createMany({ data: citationRecords });
  }

  const totalCitations = verifiedCitations.length + lowConfidenceClaims.length;

  // Update article with fact-checked content
  await prisma.article.update({
    where: { id: articleId },
    data: {
      contentMarkdown: updatedMarkdown,
      contentHtml: updatedHtml,
      citationsCount: totalCitations,
      status: "OPTIMIZING",
    },
  });

  return {
    finalContent: updatedMarkdown,
    citations: verifiedCitations,
    unresolvedCount: lowConfidenceClaims.length,
  };
}
