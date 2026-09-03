import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { calculateEstimatedViews } from "../services/estimateFormula.js";
import { getStatus, tryConsumeSearch } from "../services/rateLimiter.js";
import { verifyDevice, type VerifiedDeviceRequest } from "../middleware/verifyDevice.js";

const calculateSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Kullanıcı adı boş olamaz")
    .max(30, "Instagram kullanıcı adları 30 karakteri geçemez")
    .regex(/^[a-zA-Z0-9._]+$/, "Geçersiz kullanıcı adı"),
  followers: z.number().int().min(0).max(2_000_000_000),
  following: z.number().int().min(0).max(2_000_000_000),
  posts: z.number().int().min(0).max(10_000_000),
});

export async function calculateRoutes(app: FastifyInstance) {
  app.get("/status", { preHandler: verifyDevice }, async (req, reply) => {
    const { deviceId } = req as VerifiedDeviceRequest;
    const status = await getStatus(deviceId);
    reply.send(status);
  });

  app.post("/calculate", { preHandler: verifyDevice }, async (req, reply) => {
    const parsed = calculateSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.status(400).send({ error: "Geçersiz giriş", details: parsed.error.flatten() });
      return;
    }

    const { deviceId } = req as VerifiedDeviceRequest;
    const { allowed, status } = await tryConsumeSearch(deviceId, req.ip);

    if (!allowed) {
      reply.status(429).send({
        error: "Günlük arama hakkın bitti.",
        status,
      });
      return;
    }

    const result = calculateEstimatedViews(parsed.data);
    reply.send({ ...result, status });
  });
}
