const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * TURNSTILE_SECRET_KEY tanımlı değilse (henüz kurulmadıysa) doğrulamayı atlar -
 * geliştirmeyi bloklamamak için. Production'da .env'e eklenmesi önerilir,
 * özellikle script/bot trafiği fark edilirse.
 */
export async function verifyTurnstile(token: string | null, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  const body = new URLSearchParams({ secret, response: token, remoteip: ip });
  const res = await fetch(VERIFY_URL, { method: "POST", body });
  if (!res.ok) return false;

  const data = (await res.json()) as { success: boolean };
  return data.success;
}
