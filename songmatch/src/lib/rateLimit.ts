import { headers } from "next/headers";

type Entry = { count: number; resetAt: number };

const attempts = new Map<string, Entry>();
let checksSinceSweep = 0;

// Single-instance, in-memory fixed-window limiter. Good enough to blunt
// casual brute-force/spam on a single-process deployment; not distributed.
export function checkRateLimit(
  key: string,
  opts: { windowMs: number; max: number }
): boolean {
  const now = Date.now();

  checksSinceSweep += 1;
  if (checksSinceSweep > 500) {
    checksSinceSweep = 0;
    for (const [k, v] of attempts) {
      if (v.resetAt < now) attempts.delete(k);
    }
  }

  const entry = attempts.get(key);
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + opts.windowMs });
    return true;
  }
  if (entry.count >= opts.max) {
    return false;
  }
  entry.count += 1;
  return true;
}

export async function getClientIp() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}
