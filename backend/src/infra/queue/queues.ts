import { Queue, Worker, JobsOptions } from "bullmq";
import { env } from "../../config/env.js";
import { logger } from "../../config/logger.js";

type QueueName = "transcription" | "webhook" | "aiTasks";

const defaultJobOptions: JobsOptions = {
  attempts: 5,
  backoff: {
    type: "exponential",
    delay: 1000,
  },
  removeOnComplete: 100,
  removeOnFail: 500,
};

const bullConnection = {
  url: env.REDIS_URL,
};

export const transcriptionQueue = new Queue("transcription", {
  connection: bullConnection,
  defaultJobOptions,
});

export const webhookQueue = new Queue("webhook", {
  connection: bullConnection,
  defaultJobOptions,
});

export const aiTasksQueue = new Queue("aiTasks", {
  connection: bullConnection,
  defaultJobOptions,
});

export function startWorkers(): Worker[] {
  const workers: Array<{ name: QueueName; worker: Worker }> = [
    {
      name: "transcription",
      worker: new Worker(
        "transcription",
        async (job) => {
          logger.info({ jobId: job.id, payload: job.data }, "Processing transcription job");
        },
        { connection: bullConnection },
      ),
    },
    {
      name: "webhook",
      worker: new Worker(
        "webhook",
        async (job) => {
          logger.info({ jobId: job.id, payload: job.data }, "Delivering webhook event");
        },
        { connection: bullConnection },
      ),
    },
    {
      name: "aiTasks",
      worker: new Worker(
        "aiTasks",
        async (job) => {
          logger.info({ jobId: job.id, payload: job.data }, "Processing async AI task");
        },
        { connection: bullConnection },
      ),
    },
  ];

  for (const { name, worker } of workers) {
    worker.on("failed", (job, error) => {
      logger.error({ queue: name, jobId: job?.id, error }, "Queue job failed");
    });
  }

  return workers.map((item) => item.worker);
}
