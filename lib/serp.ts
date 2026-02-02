import { prisma } from "./prisma";

export interface SerpResult {
  position: number;
  title: string;
  url: string;
  snippet: string;
  headings: string[];
}

export interface SerpData {
  keyword: string;
  results: SerpResult[];
  fetchedAt: string;
}

const CACHE_TTL_DAYS = 30;

export async function getSerpData(keyword: string): Promise<SerpData> {
  const cached = await prisma.serpCache.findUnique({
    where: { keyword },
  });

  if (cached && cached.expiresAt > new Date()) {
    return cached.results as unknown as SerpData;
  }

  const freshData = await fetchSerpApi(keyword);

  await prisma.serpCache.upsert({
    where: { keyword },
    update: {
      results: JSON.parse(JSON.stringify(freshData)),
      expiresAt: new Date(Date.now() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
    create: {
      keyword,
      results: JSON.parse(JSON.stringify(freshData)),
      expiresAt: new Date(Date.now() + CACHE_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  return freshData;
}

async function fetchSerpApi(keyword: string): Promise<SerpData> {
  const apiKey = process.env.SERP_API_KEY;
  if (!apiKey) {
    throw new Error("SERP_API_KEY environment variable is not set");
  }

  const params = new URLSearchParams({
    q: keyword,
    api_key: apiKey,
    engine: "google",
    num: "10",
  });

  const response = await fetch(
    `https://serpapi.com/search.json?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(`SerpAPI request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const organicResults = data.organic_results ?? [];

  const results: SerpResult[] = organicResults
    .slice(0, 10)
    .map((item: Record<string, unknown>, index: number) => ({
      position: index + 1,
      title: (item.title as string) ?? "",
      url: (item.link as string) ?? "",
      snippet: (item.snippet as string) ?? "",
      headings: extractHeadings(item),
    }));

  return {
    keyword,
    results,
    fetchedAt: new Date().toISOString(),
  };
}

function extractHeadings(item: Record<string, unknown>): string[] {
  const headings: string[] = [];

  if (item.rich_snippet && typeof item.rich_snippet === "object") {
    const snippet = item.rich_snippet as Record<string, unknown>;
    if (snippet.top && typeof snippet.top === "object") {
      const top = snippet.top as Record<string, unknown>;
      if (top.detected_extensions && typeof top.detected_extensions === "object") {
        const extensions = top.detected_extensions as Record<string, string>;
        Object.values(extensions).forEach((v) => {
          if (typeof v === "string") headings.push(v);
        });
      }
    }
  }

  if (item.about_this_result && typeof item.about_this_result === "object") {
    const about = item.about_this_result as Record<string, unknown>;
    if (about.keywords && Array.isArray(about.keywords)) {
      about.keywords.forEach((k: string) => headings.push(k));
    }
  }

  return headings;
}
