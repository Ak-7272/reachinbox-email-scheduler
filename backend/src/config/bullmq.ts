import { Queue, Worker } from "bullmq";
import dotenv from "dotenv";
import { sendEmailJobHandler } from "../modules/email/email.worker";

dotenv.config();

export const EMAIL_QUEUE_NAME = "email-send-queue";

const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  throw new Error("REDIS_URL is not set in .env");
}

const connection = {
  url: redisUrl,
};

const workerConcurrency = Number(process.env.WORKER_CONCURRENCY || "5");

// Queue used by API to add jobs
export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export const startEmailWorker = () => {
  const worker = new Worker(
    EMAIL_QUEUE_NAME,
    sendEmailJobHandler,
    {
      connection,
      concurrency: workerConcurrency,
    }
  );

  worker.on("completed", job => {
    console.log("Job completed:", job.id);
  });

  worker.on("failed", (job, err) => {
    console.error("Job failed:", job?.id, err);
  });
};
