import { Queue } from "bullmq";
import { redis } from "./redis";

export const ARTICLE_QUEUE_NAME = "article-generation";

export interface ArticleJobData {
  articleId: string;
  userId: string;
  keyword: string;
  brandVoiceId?: string;
  targetLength: number;
}

// Lazy initialization to avoid build-time connection attempts
let articleQueueInstance: Queue<ArticleJobData> | null = null;

function getArticleQueue(): Queue<ArticleJobData> {
  if (!articleQueueInstance) {
    articleQueueInstance = new Queue<ArticleJobData>(ARTICLE_QUEUE_NAME, {
      connection: redis,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: { count: 100 },
        removeOnFail: { count: 200 },
      },
    });
  }
  return articleQueueInstance;
}

// Export wrapper for backwards compatibility
export const articleQueue = {
  add: async (...args: Parameters<Queue<ArticleJobData>["add"]>) => {
    return getArticleQueue().add(...args);
  },
};
