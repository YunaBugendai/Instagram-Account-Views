import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { pool } from "../config/db.js";
import { verifyAppAttestAttestation } from "../middleware/deviceAttestation.js";

const registerSchema = z.object({
  deviceId: z.string().uuid(),
  keyId: z.string().min(1),
  attestation: z.string().min(1), // base64
  challenge: z.string().min(1), // base64 - bir önceki /devices/challenge isteğinde verilen nonce
  bundleIdentifier: z.string().min(1),
});

export async function devicesRoutes(app: FastifyInstance) {
  // iOS istemcisi attestation üretmeden önce tek kullanımlık bir nonce ister.
  app.post("/devices/challenge", async (_req, reply) => {
    const challenge = crypto.randomUUID();
    reply.send({ challenge: Buffer.from(challenge).toString("base64") });
  });

  app.post("/devices/register-attestation", async (req, reply) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: "Geçersiz istek", details: parsed.error.flatten() });
    }
    const { deviceId, keyId, attestation, challenge, bundleIdentifier } = parsed.data;

    try {
      const { publicKey } = verifyAppAttestAttestation({
        attestation: Buffer.from(attestation, "base64"),
        challenge: Buffer.from(challenge, "base64"),
        keyId,
        bundleIdentifier,
      });

      await pool.query(
        `INSERT INTO attested_devices (device_id, key_id, public_key, bundle_identifier)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (device_id) DO UPDATE
           SET key_id = EXCLUDED.key_id,
               public_key = EXCLUDED.public_key,
               sign_count = 0,
               updated_at = now()`,
        [deviceId, keyId, publicKey, bundleIdentifier]
      );

      reply.send({ ok: true });
    } catch (err) {
      req.log.warn({ err }, "App Attest doğrulaması başarısız");
      reply.status(400).send({ error: "Cihaz doğrulanamadı" });
    }
  });
}
