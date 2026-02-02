import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const STAGE_MESSAGES: Record<string, string> = {
  QUEUED: "Preparing your article...",
  RESEARCHING: "Researching top search results...",
  OUTLINING: "Creating optimized outline...",
  WRITING: "Drafting article content...",
  FACT_CHECKING: "Fact-checking and adding citations...",
  OPTIMIZING: "Optimizing for SEO...",
  READY: "Article complete!",
  FAILED: "Generation failed.",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const articleId = params.id;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      }

      let completed = false;

      while (!completed) {
        try {
          const article = await prisma.article.findUnique({
            where: { id: articleId },
            select: {
              status: true,
              seoScore: true,
              readabilityScore: true,
              wordCount: true,
              errorMessage: true,
            },
          });

          if (!article) {
            send({ status: "NOT_FOUND", message: "Article not found" });
            completed = true;
            break;
          }

          const message = STAGE_MESSAGES[article.status] ?? article.status;

          send({
            status: article.status,
            message,
            seo_score: article.seoScore,
            readability_score: article.readabilityScore,
            word_count: article.wordCount,
            error_message: article.errorMessage,
          });

          if (article.status === "READY" || article.status === "FAILED") {
            completed = true;
            break;
          }

          // Poll every 2 seconds
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch {
          send({ status: "ERROR", message: "Stream error" });
          completed = true;
        }
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
