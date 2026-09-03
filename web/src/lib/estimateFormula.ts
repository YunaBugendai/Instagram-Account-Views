import { createHash } from "node:crypto";

export interface EstimateInput {
  username: string;
  followers: number;
  following: number;
  posts: number;
}

export interface EstimateResult {
  estimatedViews: number;
  breakdown: {
    base: number;
    activityFactor: number;
    popularityFactor: number;
    dailyVariationPercent: number;
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function dailyJitter(username: string): number {
  const today = new Date().toISOString().slice(0, 10);
  const hash = createHash("sha256").update(`${username.toLowerCase()}:${today}`).digest();
  const signedInt = hash.readInt32BE(0);
  const normalized = signedInt / 2147483648;
  return normalized * 0.04;
}

/**
 * Not: Bu, gerçek Instagram profil ziyaret verisi DEĞİLDİR.
 * Kullanıcının kendi girdiği takipçi / takip edilen / gönderi sayılarından
 * üretilen, eğlence amaçlı bir tahmindir.
 */
export function calculateEstimatedViews(input: EstimateInput): EstimateResult {
  const followers = Math.max(0, Math.trunc(input.followers));
  const following = Math.max(0, Math.trunc(input.following));
  const posts = Math.max(0, Math.trunc(input.posts));

  const base = followers / 25;
  const activityFactor = clamp(1 + posts / (followers + 100), 0.8, 1.5);
  const popularityFactor = clamp(
    1 + (followers - following) / (followers + following + 50),
    0.85,
    1.15
  );
  const jitter = dailyJitter(input.username || "anon");

  const raw = base * activityFactor * popularityFactor * (1 + jitter);
  const estimatedViews = Math.max(0, Math.round(raw));

  return {
    estimatedViews,
    breakdown: {
      base: Math.round(base),
      activityFactor: Number(activityFactor.toFixed(3)),
      popularityFactor: Number(popularityFactor.toFixed(3)),
      dailyVariationPercent: Number((jitter * 100).toFixed(2)),
    },
  };
}
