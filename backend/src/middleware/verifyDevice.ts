import type { FastifyReply, FastifyRequest } from "fastify";
import { pool } from "../config/db.js";
import { env } from "../config/env.js";
import { verifyAppAttestAssertion, verifyPlayIntegrityToken } from "./deviceAttestation.js";

export interface VerifiedDeviceRequest extends FastifyRequest {
  deviceId: string;
}

/**
 * Fastify preHandler. Başarısız olursa 401 döner ve zinciri durdurur.
 * Başarılı olursa request.deviceId set edilir, route handler'lar bunu güvenle kullanabilir.
 *
 * Beklenen header'lar:
 *   x-device-id: string (uuid, istemcinin kalıcı olmayan-ama-tekrar-üretilemeyen kimliği)
 *   x-platform: "android" | "ios"
 *   Android: x-play-integrity-token
 *   iOS: x-app-attest-assertion (base64), x-app-attest-sign-count (number)
 */
export async function verifyDevice(req: FastifyRequest, reply: FastifyReply): Promise<void> {
  const deviceId = req.headers["x-device-id"];
  const platform = req.headers["x-platform"];

  if (typeof deviceId !== "string" || typeof platform !== "string") {
    reply.status(401).send({ error: "Cihaz kimliği veya platform eksik" });
    return;
  }

  if (platform === "android") {
    const token = req.headers["x-play-integrity-token"];
    if (typeof token !== "string") {
      reply.status(401).send({ error: "Play Integrity token eksik" });
      return;
    }
    const verdict = await verifyPlayIntegrityToken(token, env.ANDROID_PACKAGE_NAME);
    if (!verdict.verified) {
      req.log.warn({ reason: verdict.reason, deviceId }, "Play Integrity doğrulaması reddedildi");
      reply.status(401).send({ error: "Cihaz doğrulanamadı" });
      return;
    }
  } else if (platform === "ios") {
    // signCount client'tan alınmaz - tek doğruluk kaynağı Postgres'teki attested_devices tablosudur,
    // aksi halde client sahte bir sayı göndererek replay korumasını atlatabilirdi.
    const assertionB64 = req.headers["x-app-attest-assertion"];
    if (typeof assertionB64 !== "string") {
      reply.status(401).send({ error: "App Attest assertion eksik" });
      return;
    }

    const { rows } = await pool.query<{
      public_key: string;
      bundle_identifier: string;
      sign_count: string;
    }>("SELECT public_key, bundle_identifier, sign_count FROM attested_devices WHERE device_id = $1", [
      deviceId,
    ]);
    const device = rows[0];
    if (!device) {
      reply.status(401).send({ error: "Cihaz kayıtlı değil, önce /devices/register-attestation çağrılmalı" });
      return;
    }

    // payload: istemcinin generateAssertionAsync'e verdiği DEĞERİN AYNISI olmalı (JSON.stringify(body)).
    // node-app-attest kendi içinde Apple'ın beklediği şekilde hash'ler; burada tekrar hash'lemiyoruz.
    const payload = Buffer.from(JSON.stringify(req.body ?? {}), "utf-8");

    try {
      const { signCount } = verifyAppAttestAssertion({
        assertion: Buffer.from(assertionB64, "base64"),
        payload,
        publicKey: device.public_key,
        bundleIdentifier: device.bundle_identifier,
        signCount: Number(device.sign_count),
      });
      await pool.query("UPDATE attested_devices SET sign_count = $1, updated_at = now() WHERE device_id = $2", [
        signCount,
        deviceId,
      ]);
    } catch (err) {
      req.log.warn({ err, deviceId }, "App Attest assertion doğrulaması başarısız");
      reply.status(401).send({ error: "Cihaz doğrulanamadı" });
      return;
    }
  } else {
    reply.status(401).send({ error: "Bilinmeyen platform" });
    return;
  }

  (req as VerifiedDeviceRequest).deviceId = deviceId;
}
