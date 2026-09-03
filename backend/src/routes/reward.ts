import type { FastifyInstance } from "fastify";
import { pool } from "../config/db.js";
import { grantBonusSearch, getStatus } from "../services/rateLimiter.js";
import { verifySsvCallback } from "../services/admobSsv.js";
import { issueRewardToken, markTransactionOnce, resolveRewardToken } from "../services/rewardTokens.js";
import { verifyDevice, type VerifiedDeviceRequest } from "../middleware/verifyDevice.js";

export async function rewardRoutes(app: FastifyInstance) {
  // 1) İstemci, ödüllü reklamı göstermeden HEMEN ÖNCE bunu çağırır.
  app.post("/reward/request", { preHandler: verifyDevice }, async (req, reply) => {
    const { deviceId } = req as VerifiedDeviceRequest;
    const token = await issueRewardToken(deviceId);
    reply.send({ customData: token });
  });

  // 2) AdMob'un sunucuları bunu çağırır (istemciden DEĞİL). Bu yüzden burada verifyDevice yok;
  //    güvenlik tamamen ECDSA imza doğrulamasından geliyor.
  app.get("/reward/callback", async (req, reply) => {
    const query = req.query as Record<string, string | undefined>;
    const {
      ad_network: adNetwork,
      ad_unit: adUnit,
      reward_amount: rewardAmount,
      reward_item: rewardItem,
      timestamp,
      transaction_id: transactionId,
      custom_data: customData,
      key_id: keyId,
      signature,
    } = query;

    if (!adUnit || !rewardAmount || !transactionId || !keyId || !signature || !customData) {
      reply.status(400).send("eksik parametre");
      return;
    }

    const { valid, reason } = await verifySsvCallback(req.raw.url ?? "", {
      adNetwork: adNetwork ?? "",
      adUnit,
      rewardAmount,
      rewardItem: rewardItem ?? "",
      timestamp: timestamp ?? "",
      transactionId,
      customData,
      keyId,
      signature,
    });

    if (!valid) {
      req.log.warn({ reason, transactionId }, "AdMob SSV imzası geçersiz");
      reply.status(400).send("imza doğrulanamadı");
      return;
    }

    const deviceId = await resolveRewardToken(customData);
    if (!deviceId) {
      // token süresi dolmuş ya da hiç var olmamış - şüpheli, ödül verme
      req.log.warn({ transactionId }, "customData'ya karşılık gelen cihaz bulunamadı");
      reply.status(400).send("bilinmeyen token");
      return;
    }

    const firstTime = await markTransactionOnce(transactionId);
    if (!firstTime) {
      // AdMob aynı callback'i tekrar denemiş olabilir - ödül zaten verildi, sessizce 200 dön
      reply.status(200).send("zaten işlendi");
      return;
    }

    await grantBonusSearch(deviceId);
    await pool.query(
      `INSERT INTO reward_grants (device_id, transaction_id, ad_unit, reward_amount)
       VALUES ($1, $2, $3, $4)`,
      [deviceId, transactionId, adUnit, Number(rewardAmount)]
    );

    reply.status(200).send("ok");
  });

  app.get("/reward/status", { preHandler: verifyDevice }, async (req, reply) => {
    const { deviceId } = req as VerifiedDeviceRequest;
    reply.send(await getStatus(deviceId));
  });
}
