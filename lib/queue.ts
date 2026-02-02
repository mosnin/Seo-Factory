import { Queue } from "bullmq";
import { redis } from "./redis";

export const ARTICLE_QUEUE_NAME = "article-generation";

export const articleQueue = new Queue(ARTICLE_QUEUE_NAME, {
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

export interface ArticleJobData {
  articleId: string;
  userId: string;
  keyword: string;
  brandVoiceId?: string;
  targetLength: number;
}
