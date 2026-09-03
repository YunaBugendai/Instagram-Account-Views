import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { calculateEstimatedViews } from "@/lib/estimateFormula";
import { getClientIp } from "@/lib/ip";
import { verifyTurnstile } from "@/lib/turnstile";

export const runtime = "nodejs";

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
  turnstileToken: z.string().optional(),
});

// Not: artık günlük hak / veritabanı yok. Sınırsız kullanıcıya hizmet veriyoruz,
// gelir modeli her hesaplamada gösterilen reklamdan geliyor (bkz. Calculator.tsx).
// Turnstile hâlâ burada duruyor çünkü Redis'e ihtiyacı yok, script/bot trafiğini
// (ki bu hem sunucu maliyeti hem de reklam görüntülenme kalitesi için önemli) ücretsiz
// engelliyor - istemiyorsan TURNSTILE_SECRET_KEY'i hiç tanımlama, otomatik atlanır.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = calculateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Geçersiz giriş", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const ip = getClientIp(req.headers);
  const botCheckOk = await verifyTurnstile(parsed.data.turnstileToken ?? null, ip);
  if (!botCheckOk) {
    return NextResponse.json({ error: "Bot doğrulaması başarısız" }, { status: 400 });
  }

  const result = calculateEstimatedViews(parsed.data);
  return NextResponse.json(result);
}
