import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { connectDatabase, disconnectDatabase } from "./infra/database/prisma.js";
import { startWorkers } from "./infra/queue/queues.js";
import { redis, redisPublisher, redisSubscriber } from "./infra/cache/redis.js";

async function bootstrap() {
  await connectDatabase();
  const app = await buildApp();
  const workers = startWorkers();

  const closeGracefully = async () => {
    logger.info("Shutting down gracefully...");
    await app.close();
    await Promise.all(workers.map((worker) => worker.close()));
    await disconnectDatabase();
    await Promise.all([redis.quit(), redisPublisher.quit(), redisSubscriber.quit()]);
    process.exit(0);
  };

  process.on("SIGINT", closeGracefully);
  process.on("SIGTERM", closeGracefully);

  try {
    await app.listen({
      host: env.HOST,
      port: env.PORT,
    });

    logger.info({ host: env.HOST, port: env.PORT }, "VoxAI backend is running");
  } catch (error) {
    logger.error({ error }, "Failed to start server");
    await closeGracefully();
  }
}

void bootstrap();
