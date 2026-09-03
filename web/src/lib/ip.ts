export function getClientIp(headers: Headers): string {
  // Vercel gibi platformlar arkasında gerçek istemci IP'si bu header'da gelir.
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}
