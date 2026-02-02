import Anthropic from "@anthropic-ai/sdk";
import type { SerpData } from "./serp";

const globalForAnthropic = globalThis as unknown as { anthropic: Anthropic };

export const anthropic =
  globalForAnthropic.anthropic ??
  new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

if (process.env.NODE_ENV !== "production") {
  globalForAnthropic.anthropic = anthropic;
}

export interface OutlineSection {
  h2: string;
  h3s: string[];
  key_points: string[];
}

export async function generateOutline(
  keyword: string,
  serpData: SerpData,
  brandVoiceGuidelines?: string
): Promise<OutlineSection[]> {
  const serpSummary = serpData.results
    .map(
      (r) =>
        `Position ${r.position}: "${r.title}"\nURL: ${r.url}\nSnippet: ${r.snippet}`
    )
    .join("\n\n");

  const brandVoiceContext = brandVoiceGuidelines
    ? `\n\nBrand voice guidelines to follow:\n${brandVoiceGuidelines}`
    : "";

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Analyze these top-ranking articles and create an SEO-optimized outline.

Target keyword: ${keyword}

Top 10 SERP results:
${serpSummary}
${brandVoiceContext}

Create a comprehensive article outline that would outrank these existing articles. The outline should cover the topic thoroughly while being well-structured for SEO.

Output ONLY valid JSON — no markdown fences, no explanation. The format must be:
[
  {
    "h2": "Section heading",
    "h3s": ["Subheading 1", "Subheading 2"],
    "key_points": ["Key point to cover", "Another key point"]
  }
]

Include 4-8 H2 sections, each with relevant H3 subheadings and key points to cover.`,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  const parsed = JSON.parse(textBlock.text);

  if (!Array.isArray(parsed)) {
    throw new Error("Claude response is not an array");
  }

  return parsed as OutlineSection[];
}
