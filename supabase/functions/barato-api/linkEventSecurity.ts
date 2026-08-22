export type ClientMetadata = {
  ip: string | null;
  browser: string | null;
  operatingSystem: string | null;
  device: string | null;
};

function firstHeaderValue(value: string | null) {
  return value?.split(",")[0]?.trim().replace(/^"|"$/g, "") || null;
}

function normalizeIp(value: string | null) {
  if (!value) return null;
  const candidate = value.trim().replace(/^\[|\]$/g, "").replace(/^::ffff:/i, "");
  if (!candidate || candidate.length > 64 || /[^0-9a-fA-F:.]/.test(candidate)) return null;
  return candidate;
}

export function isPublicIp(value: string | null) {
  const ip = normalizeIp(value);
  if (!ip) return false;
  if (ip.includes(":")) {
    const lowered = ip.toLowerCase();
    return lowered !== "::1" && !lowered.startsWith("fc") && !lowered.startsWith("fd") && !lowered.startsWith("fe80:") && !lowered.startsWith("2001:db8:");
  }
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b] = parts;
  return a !== 0 && a !== 10 && a !== 127 && a !== 169 && a !== 192 && !(a === 100 && b >= 64 && b <= 127) && !(a === 172 && b >= 16 && b <= 31) && !(a === 192 && b === 168);
}

export function clientIpFromHeaders(headers: Headers) {
  const candidates = [
    headers.get("cf-connecting-ip"),
    headers.get("x-real-ip"),
    firstHeaderValue(headers.get("x-forwarded-for")),
    headers.get("x-client-ip"),
  ];
  for (const candidate of candidates) {
    const ip = normalizeIp(candidate);
    if (isPublicIp(ip)) return ip;
  }
  return null;
}

export function clientMetadataFromRequest(headers: Headers): ClientMetadata {
  const agent = (headers.get("user-agent") ?? "").slice(0, 512);
  const browser = /edg\//i.test(agent) ? "Edge" : /opr\//i.test(agent) ? "Opera" : /firefox\//i.test(agent) ? "Firefox" : /chrome\//i.test(agent) ? "Chrome" : /safari\//i.test(agent) ? "Safari" : null;
  const operatingSystem = /iphone|ipad|ipod/i.test(agent) ? "iOS" : /android/i.test(agent) ? "Android" : /windows/i.test(agent) ? "Windows" : /mac os/i.test(agent) ? "macOS" : /linux/i.test(agent) ? "Linux" : null;
  const device = /ipad|tablet/i.test(agent) ? "tablet" : /iphone|ipod|android.*mobile|mobile/i.test(agent) ? "mobile" : agent ? "desktop" : null;
  return { ip: clientIpFromHeaders(headers), browser, operatingSystem, device };
}

export function eventRetentionCutoff(now = Date.now(), retentionDays = 30) {
  return new Date(now - retentionDays * 24 * 60 * 60 * 1000).toISOString();
}
