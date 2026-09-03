import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import Fastify from "fastify";
import { env } from "./config/env.js";
import { closeDb } from "./config/db.js";
import { closeRateLimiter } from "./services/rateLimiter.js";
import { calculateRoutes } from "./routes/calculate.js";
import { devicesRoutes } from "./routes/devices.js";
import { rewardRoutes } from "./routes/reward.js";

async function main() {
  const app = Fastify({
    logger:
      env.NODE_ENV === "development"
        ? { transport: { target: "pino-pretty" } }
        : true,
  });

  await app.register(cors, { origin: env.CORS_ORIGIN });

  // Genel amaçlı DoS/abuse koruması - iş mantığındaki günlük hak sınırından ayrı,
  // tek bir cihazın/IP'nin sunucuyu bombalamasını engellemek için.
  await app.register(rateLimit, {
    max: 60,
    timeWindow: "1 minute",
  });

  app.get("/health", async () => ({ ok: true }));

  await app.register(devicesRoutes);
  await app.register(calculateRoutes);
  await app.register(rewardRoutes);

  const shutdown = async () => {
    app.log.info("Kapatılıyor...");
    await app.close();
    await closeDb();
    await closeRateLimiter();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await app.listen({ port: env.PORT, host: "0.0.0.0" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
