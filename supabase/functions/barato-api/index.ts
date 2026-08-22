import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { Buffer } from "node:buffer";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { clientMetadataFromRequest, eventRetentionCutoff } from "./linkEventSecurity.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://wiwiwi-coder7.github.io",
  "Access-Control-Allow-Headers": "apikey, authorization, content-type, x-admin-token, x-image-token",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Content-Type": "application/json",
};
const url = Deno.env.get("SUPABASE_URL")!;
const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db = createClient(url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });
const colors = new Set(["#E8538A", "#9560FF", "#587AFF"]);

function json(body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: corsHeaders }); }
function hash(value: string) { return createHash("sha256").update(value).digest("hex"); }
function token() { return randomBytes(32).toString("base64url"); }
function adminToken(request: Request) { return request.headers.get("x-admin-token") ?? ""; }
function imageToken(request: Request) { return request.headers.get("x-image-token") ?? ""; }
function toGift(row: Record<string, unknown>) {
  return { id: Number(row.id), name: row.name, message: row.message, personalMessage: row.personal_message, imageKey: row.image_key, color: row.color, theme: row.theme, token: row.token, createdAt: row.created_at, updatedAt: row.updated_at, expiresAt: row.expires_at, experience: row.experience ?? "gift", birthdayAge: row.birthday_age, birthdayCakeKey: row.birthday_cake_key, birthdayHasBuiltinCandles: Boolean(row.birthday_has_builtin_candles) };
}
function toBirthday(row: Record<string, unknown>) {
  return { owner: row.owner, catText: row.cat_text, cakeText: row.cake_text, motorText: row.motor_text, catImageKey: row.cat_image_key, cakeImageKey: row.cake_image_key, motorImageKey: row.motor_image_key, createdAt: row.created_at, updatedAt: row.updated_at };
}
function toPublicBirthdaySettings(row: Record<string, unknown>) {
  return { isEnabled: Boolean(row.is_enabled), candlePrompt: row.candle_prompt, backgroundColor: row.background_color, updatedAt: row.updated_at };
}
function toCakePreset(row: Record<string, unknown>) {
  return { id: Number(row.id), slug: row.slug, label: row.label, imageKey: row.image_key, hasBuiltinCandles: Boolean(row.has_builtin_candles), sortOrder: Number(row.sort_order), isActive: Boolean(row.is_active) };
}
function verify(password: string, stored: string) {
  const [algorithm, salt, key] = stored.split("$");
  if (algorithm !== "scrypt" || !salt || !key) return false;
  const received = Buffer.from(scryptSync(password, salt, 64).toString("hex"), "hex");
  const expected = Buffer.from(key, "hex");
  return expected.length === received.length && timingSafeEqual(expected, received);
}
function passwordHash(password: string) { const salt = randomBytes(16).toString("hex"); return `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`; }
function isValidAdminPassword(password: unknown) { return typeof password === "string" && password.length >= 12 && password.length <= 128; }
function isValidImageKey(value: unknown) { return typeof value === "string" && /^[A-Za-z0-9._/-]+$/.test(value); }
function isValidBirthdayPrompt(value: unknown) { return typeof value === "string" && value.trim().length > 0 && value.trim().length <= 120; }
function isValidBirthdayColor(value: unknown) { return typeof value === "string" && /^#[0-9A-Fa-f]{6}$/.test(value); }
function isValidCakeLabel(value: unknown) { return typeof value === "string" && value.trim().length > 0 && value.trim().length <= 100; }
function isValidSortOrder(value: unknown) { return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 999; }
async function birthdayPublicSettings() {
  const { data, error } = await db.from("birthday_public_settings").select("*").eq("setting_key", "public").single();
  if (error) throw new Error(error.message);
  return data;
}
function validGift(input: Record<string, unknown>) {
  const birthday = input.experience === "birthday";
  const birthdayAge = Number(input.birthdayAge);
  return typeof input.name === "string" && input.name.trim().length > 0 && input.name.trim().length <= 80 &&
    typeof input.message === "string" && input.message.trim().length > 0 && input.message.trim().length <= 160 &&
    (input.personalMessage == null || (typeof input.personalMessage === "string" && input.personalMessage.length <= 1000)) &&
    (input.imageKey == null || (typeof input.imageKey === "string" && /^[A-Za-z0-9._/-]+$/.test(input.imageKey))) &&
    typeof input.color === "string" && colors.has(input.color.toUpperCase()) && (input.theme === "light" || input.theme === "dark") &&
    (input.experience == null || input.experience === "gift" || birthday) &&
    (!birthday || (Number.isInteger(birthdayAge) && birthdayAge >= 0 && birthdayAge <= 99 && typeof input.birthdayCakeKey === "string" && /^[A-Za-z0-9._/-]+$/.test(input.birthdayCakeKey) && typeof input.birthdayHasBuiltinCandles === "boolean"));
}
async function isAdmin(request: Request) {
  const value = adminToken(request);
  if (!value) return false;
  const { data } = await db.from("admin_sessions").select("id").eq("token_hash", hash(value)).gt("expires_at", new Date().toISOString()).maybeSingle();
  return Boolean(data);
}
async function requireAdmin(request: Request) { if (!(await isAdmin(request))) throw new Error("ADMIN_REQUIRED"); }
async function hasImageUnlock(request: Request) {
  const value = imageToken(request);
  if (!value) return false;
  const { data } = await db.from("gift_unlock_sessions").select("id").eq("token_hash", hash(value)).gt("expires_at", new Date().toISOString()).maybeSingle();
  return Boolean(data);
}
function errorStatus(error: unknown) { return error instanceof Error && error.message === "ADMIN_REQUIRED" ? 401 : 500; }
function makeKey(mime: string) { return `${crypto.randomUUID()}.${mime === "image/jpeg" ? "jpg" : mime === "image/png" ? "png" : "webp"}`; }

async function resolveApproximateLocation(ip: string | null) {
  if (!ip) return { city: null, region: null, country: null };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 700);
  try {
    const response = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}`, { signal: controller.signal, headers: { accept: "application/json" } });
    if (!response.ok) return { city: null, region: null, country: null };
    const payload = await response.json() as { success?: boolean; city?: unknown; region?: unknown; country?: unknown };
    if (payload.success === false) return { city: null, region: null, country: null };
    const text = (value: unknown) => typeof value === "string" && value.trim().length <= 128 ? value.trim() : null;
    return { city: text(payload.city), region: text(payload.region), country: text(payload.country) };
  } catch {
    return { city: null, region: null, country: null };
  } finally {
    clearTimeout(timeout);
  }
}

async function recordLinkEvent(giftId: number, eventType: "created" | "opened", request: Request) {
  try {
    const client = clientMetadataFromRequest(request.headers);
    const location = await resolveApproximateLocation(client.ip);
    await db.from("gift_link_events").insert({
      gift_id: giftId,
      event_type: eventType,
      source_ip: client.ip,
      ip_fingerprint: client.ip ? hash(`barato-link-event:${client.ip}`) : null,
      city: location.city,
      region: location.region,
      country: location.country,
      browser: client.browser,
      operating_system: client.operatingSystem,
      device: client.device,
    });
  } catch {
    // Event recording is deliberately non-blocking: gift creation and opening must remain available.
  }
}

function defer(promise: Promise<unknown>) { EdgeRuntime.waitUntil(promise); }

Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const requestUrl = new URL(request.url);
    const action = requestUrl.searchParams.get("action") ?? "";

    if (action === "warm") return json({ ready: true });

    if (action === "create-gift" && request.method === "POST") {
      const body = await request.json();
      if (!validGift(body)) return json({ error: "INVALID_GIFT" }, 400);
      if (body.experience === "birthday" && !(await birthdayPublicSettings()).is_enabled) return json({ error: "BIRTHDAY_DISABLED" }, 403);
      const expiresAt = body.expiresAt ? new Date(String(body.expiresAt)) : null;
      if (expiresAt && (!Number.isFinite(expiresAt.getTime()) || expiresAt.getTime() <= Date.now())) return json({ error: "INVALID_EXPIRATION" }, 400);
      const creatorToken = token();
      const birthday = body.experience === "birthday";
      const record = { name: body.name.trim(), message: body.message.trim(), personal_message: typeof body.personalMessage === "string" && body.personalMessage.trim() ? body.personalMessage.trim() : null, image_key: null, color: body.color, theme: body.theme, token: randomBytes(18).toString("base64url"), expires_at: expiresAt?.toISOString() ?? null, creator_token_hash: hash(creatorToken), creator_token_expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), experience: birthday ? "birthday" : "gift", birthday_age: birthday ? Number(body.birthdayAge) : null, birthday_cake_key: birthday ? body.birthdayCakeKey : null, birthday_has_builtin_candles: birthday ? body.birthdayHasBuiltinCandles : false };
      const { data, error } = await db.from("gifts").insert(record).select().single();
      if (error) throw new Error(error.message);
      defer(recordLinkEvent(Number(data.id), "created", request));
      return json({ gift: toGift(data), creatorToken });
    }

    if (action === "get-gift") {
      const key = requestUrl.searchParams.get("token") ?? "";
      if (!/^[A-Za-z0-9_-]{12,48}$/.test(key)) return json({ gift: null });
      const { data, error } = await db.from("gifts").select("*").eq("token", key).maybeSingle();
      if (error) throw new Error(error.message);
      if (!data || (data.expires_at && new Date(data.expires_at).getTime() <= Date.now())) return json({ gift: null });
      return json({ gift: toGift(data) });
    }

    if (action === "birthday-public-settings") {
      const settings = await birthdayPublicSettings();
      return json({ settings: toPublicBirthdaySettings(settings) });
    }

    if (action === "birthday-cake-presets") {
      const { data, error } = await db.from("birthday_cake_presets").select("id,slug,label,image_key,has_builtin_candles,sort_order").eq("is_active", true).order("sort_order", { ascending: true }).limit(50);
      if (error) throw new Error(error.message);
      return json({ presets: (data ?? []).map(toCakePreset) });
    }

    if (action === "record-visit" && request.method === "POST") {
      const body = await request.json();
      if (typeof body.token !== "string") return json({ recorded: false }, 400);
      const { data: gift } = await db.from("gifts").select("id, expires_at").eq("token", body.token).maybeSingle();
      if (!gift || (gift.expires_at && new Date(gift.expires_at).getTime() <= Date.now())) return json({ recorded: false });
      const { error } = await db.from("gift_visits").insert({ gift_id: gift.id });
      if (error) throw new Error(error.message);
      defer(recordLinkEvent(Number(gift.id), "opened", request));
      return json({ recorded: true });
    }

    if (action === "birthday") {
      const { data, error } = await db.from("birthday_contents").select("*").eq("owner", "edi").maybeSingle();
      if (error) throw new Error(error.message);
      return json({ content: data ? toBirthday(data) : null });
    }

    if (action === "unlock-image" && request.method === "POST") {
      const body = await request.json();
      const { data, error } = await db.from("admin_config").select("password_hash,gift_password_hash").eq("id", 1).single();
      if (error) throw new Error(error.message);
      if (typeof body.password !== "string" || (!verify(body.password, data.gift_password_hash) && !verify(body.password, data.password_hash))) return json({ error: "INVALID_PASSWORD" }, 401);
      const value = token(); const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      const { error: sessionError } = await db.from("gift_unlock_sessions").insert({ token_hash: hash(value), expires_at: expiresAt });
      if (sessionError) throw new Error(sessionError.message);
      return json({ token: value, expiresAt });
    }

    if (action === "upload-image" && request.method === "POST") {
      if (!(await isAdmin(request)) && !(await hasImageUnlock(request))) return json({ error: "IMAGE_UNLOCK_REQUIRED" }, 403);
      const body = await request.json();
      if (!["image/jpeg", "image/png", "image/webp"].includes(body.mimeType) || typeof body.base64 !== "string" || body.base64.length > 1_400_000) return json({ error: "INVALID_IMAGE" }, 400);
      const bytes = Buffer.from(body.base64, "base64");
      if (!bytes.length || bytes.length > 1_000_000) return json({ error: "INVALID_IMAGE" }, 400);
      const key = makeKey(body.mimeType);
      const { error } = await db.storage.from("gift-media").upload(key, bytes, { contentType: body.mimeType, upsert: false, cacheControl: "31536000" });
      if (error) throw new Error(error.message);
      return json({ key });
    }

    if (action === "attach-image" && request.method === "POST") {
      const body = await request.json();
      if (typeof body.giftToken !== "string" || typeof body.creatorToken !== "string" || typeof body.imageKey !== "string" || !/^[A-Za-z0-9._/-]+$/.test(body.imageKey)) return json({ error: "INVALID_IMAGE_ATTACHMENT" }, 400);
      const { data: gift, error: lookupError } = await db.from("gifts").select("id, expires_at, creator_token_expires_at").eq("token", body.giftToken).eq("creator_token_hash", hash(body.creatorToken)).maybeSingle();
      if (lookupError) throw new Error(lookupError.message);
      if (!gift || (gift.expires_at && new Date(gift.expires_at).getTime() <= Date.now()) || !gift.creator_token_expires_at || new Date(gift.creator_token_expires_at).getTime() <= Date.now()) return json({ error: "IMAGE_ATTACH_UNAUTHORIZED" }, 403);
      const imageColumn = body.target === "birthdayCake" ? "birthday_cake_key" : "image_key";
      const { data, error } = await db.from("gifts").update({ [imageColumn]: body.imageKey, creator_token_hash: null, creator_token_expires_at: null, updated_at: new Date().toISOString() }).eq("id", gift.id).select().single();
      if (error) throw new Error(error.message);
      return json({ gift: toGift(data) });
    }

    if (action === "admin-login" && request.method === "POST") {
      const body = await request.json();
      const { data, error } = await db.from("admin_config").select("password_hash").eq("id", 1).single();
      if (error) throw new Error(error.message);
      if (typeof body.password !== "string" || !verify(body.password, data.password_hash)) return json({ error: "INVALID_CREDENTIALS" }, 401);
      const value = token(); const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
      const { error: sessionError } = await db.from("admin_sessions").insert({ token_hash: hash(value), expires_at: expiresAt });
      if (sessionError) throw new Error(sessionError.message);
      return json({ token: value, expiresAt });
    }

    if (action === "admin-session") return json({ authenticated: await isAdmin(request) });
    if (action === "admin-change-password" && request.method === "POST") {
      await requireAdmin(request);
      const body = await request.json();
      if (!isValidAdminPassword(body.newPassword) || body.newPassword !== body.confirmPassword || body.newPassword === body.currentPassword) return json({ error: "INVALID_NEW_PASSWORD" }, 400);
      const { data, error } = await db.from("admin_config").select("password_hash").eq("id", 1).single();
      if (error) throw new Error(error.message);
      if (typeof body.currentPassword !== "string" || !verify(body.currentPassword, data.password_hash)) return json({ error: "INVALID_CURRENT_PASSWORD" }, 401);
      const { error: updateError } = await db.from("admin_config").update({ password_hash: passwordHash(body.newPassword), updated_at: new Date().toISOString() }).eq("id", 1);
      if (updateError) throw new Error(updateError.message);
      const { error: sessionError } = await db.from("admin_sessions").delete().neq("id", 0);
      if (sessionError) throw new Error(sessionError.message);
      return json({ success: true });
    }
    if (action === "admin-logout" && request.method === "POST") {
      const value = adminToken(request); if (value) await db.from("admin_sessions").delete().eq("token_hash", hash(value)); return json({ success: true });
    }
    if (action === "admin-gifts") { await requireAdmin(request); const { data, error } = await db.from("gifts").select("*").order("created_at", { ascending: false }); if (error) throw new Error(error.message); return json({ gifts: (data ?? []).map(toGift) }); }
    if (action === "admin-link-events") {
      await requireAdmin(request);
      const giftId = Number(requestUrl.searchParams.get("id"));
      if (!Number.isInteger(giftId) || giftId < 1) return json({ error: "INVALID_GIFT" }, 400);
      const cutoff = eventRetentionCutoff();
      await db.from("gift_link_events").delete().lt("created_at", cutoff);
      const { data, error } = await db.from("gift_link_events").select("id,event_type,source_ip,city,region,country,browser,operating_system,device,created_at").eq("gift_id", giftId).gte("created_at", cutoff).order("created_at", { ascending: false }).limit(100);
      if (error) throw new Error(error.message);
      return json({ events: (data ?? []).map(event => ({ id: Number(event.id), eventType: event.event_type, ipAddress: event.source_ip, city: event.city, region: event.region, country: event.country, browser: event.browser, operatingSystem: event.operating_system, device: event.device, createdAt: event.created_at })) });
    }
    if (action === "admin-analytics") { await requireAdmin(request); const [{ data: giftRows, error: giftError }, { data: visitRows, error: visitError }] = await Promise.all([db.from("gifts").select("id"), db.from("gift_visits").select("gift_id")]); if (giftError) throw new Error(giftError.message); if (visitError) throw new Error(visitError.message); const visits = new Map<number, number>(); for (const visit of visitRows ?? []) visits.set(Number(visit.gift_id), (visits.get(Number(visit.gift_id)) ?? 0) + 1); return json({ totalLinks: giftRows?.length ?? 0, totalVisits: visitRows?.length ?? 0, perGift: (giftRows ?? []).map(gift => ({ giftId: Number(gift.id), visits: visits.get(Number(gift.id)) ?? 0 })) }); }
    if (action === "admin-birthday-public-settings") { await requireAdmin(request); return json({ settings: toPublicBirthdaySettings(await birthdayPublicSettings()) }); }
    if (action === "admin-update-birthday-public-settings" && request.method === "PATCH") {
      await requireAdmin(request);
      const body = await request.json();
      if (typeof body.isEnabled !== "boolean" || !isValidBirthdayPrompt(body.candlePrompt) || !isValidBirthdayColor(body.backgroundColor)) return json({ error: "INVALID_BIRTHDAY_SETTINGS" }, 400);
      const { data, error } = await db.from("birthday_public_settings").update({ is_enabled: body.isEnabled, candle_prompt: body.candlePrompt.trim(), background_color: body.backgroundColor.toUpperCase(), updated_at: new Date().toISOString() }).eq("setting_key", "public").select().single();
      if (error) throw new Error(error.message);
      return json({ settings: toPublicBirthdaySettings(data) });
    }
    if (action === "admin-birthday-presets") {
      await requireAdmin(request);
      const { data, error } = await db.from("birthday_cake_presets").select("*").order("sort_order", { ascending: true }).limit(100);
      if (error) throw new Error(error.message);
      return json({ presets: (data ?? []).map(toCakePreset) });
    }
    if (action === "admin-create-birthday-preset" && request.method === "POST") {
      await requireAdmin(request);
      const body = await request.json();
      if (!isValidCakeLabel(body.label) || !isValidImageKey(body.imageKey) || typeof body.hasBuiltinCandles !== "boolean" || !isValidSortOrder(body.sortOrder)) return json({ error: "INVALID_BIRTHDAY_PRESET" }, 400);
      const { data, error } = await db.from("birthday_cake_presets").insert({ slug: `cake-${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`, label: body.label.trim(), image_key: body.imageKey, has_builtin_candles: body.hasBuiltinCandles, sort_order: body.sortOrder, is_active: body.isActive !== false, updated_at: new Date().toISOString() }).select().single();
      if (error) throw new Error(error.message);
      return json({ preset: toCakePreset(data) });
    }
    if (action === "admin-update-birthday-preset" && request.method === "PATCH") {
      await requireAdmin(request);
      const body = await request.json();
      if (!Number.isInteger(body.id) || body.id < 1 || !isValidCakeLabel(body.label) || !isValidImageKey(body.imageKey) || typeof body.hasBuiltinCandles !== "boolean" || typeof body.isActive !== "boolean" || !isValidSortOrder(body.sortOrder)) return json({ error: "INVALID_BIRTHDAY_PRESET" }, 400);
      const { data, error } = await db.from("birthday_cake_presets").update({ label: body.label.trim(), image_key: body.imageKey, has_builtin_candles: body.hasBuiltinCandles, is_active: body.isActive, sort_order: body.sortOrder, updated_at: new Date().toISOString() }).eq("id", body.id).select().single();
      if (error) throw new Error(error.message);
      return json({ preset: toCakePreset(data) });
    }
    if (action === "admin-delete-birthday-preset" && request.method === "DELETE") {
      await requireAdmin(request);
      const id = Number(requestUrl.searchParams.get("id"));
      if (!Number.isInteger(id) || id < 1) return json({ error: "INVALID_BIRTHDAY_PRESET" }, 400);
      const { error } = await db.from("birthday_cake_presets").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return json({ success: true });
    }
    if (action === "admin-birthday") { await requireAdmin(request); const { data, error } = await db.from("birthday_contents").select("*").eq("owner", "edi").single(); if (error) throw new Error(error.message); return json({ content: toBirthday(data) }); }
    if (action === "admin-update-gift" && request.method === "PATCH") { await requireAdmin(request); const body = await request.json(); if (!Number.isInteger(body.id) || !validGift(body)) return json({ error: "INVALID_GIFT" }, 400); const { data, error } = await db.from("gifts").update({ name: body.name.trim(), message: body.message.trim(), personal_message: body.personalMessage?.trim() || null, image_key: body.imageKey ?? null, color: body.color, theme: body.theme, expires_at: body.expiresAt ? new Date(body.expiresAt).toISOString() : null, updated_at: new Date().toISOString() }).eq("id", body.id).select().maybeSingle(); if (error) throw new Error(error.message); return json({ gift: data ? toGift(data) : null }); }
    if (action === "admin-delete-gift" && request.method === "DELETE") { await requireAdmin(request); const id = Number(requestUrl.searchParams.get("id")); if (!Number.isInteger(id) || id < 1) return json({ error: "INVALID_GIFT" }, 400); const { error } = await db.from("gifts").delete().eq("id", id); if (error) throw new Error(error.message); return json({ success: true }); }
    if (action === "admin-update-birthday" && request.method === "PATCH") { await requireAdmin(request); const body = await request.json(); if (![body.catText, body.cakeText, body.motorText].every(value => typeof value === "string" && value.trim().length > 0)) return json({ error: "INVALID_BIRTHDAY" }, 400); const { data, error } = await db.from("birthday_contents").update({ cat_text: body.catText.trim(), cake_text: body.cakeText.trim(), motor_text: body.motorText.trim(), cat_image_key: body.catImageKey ?? null, cake_image_key: body.cakeImageKey ?? null, motor_image_key: body.motorImageKey ?? null, updated_at: new Date().toISOString() }).eq("owner", "edi").select().single(); if (error) throw new Error(error.message); return json({ content: toBirthday(data) }); }

    return json({ error: "NOT_FOUND" }, 404);
  } catch (error) { return json({ error: error instanceof Error ? error.message : "UNKNOWN_ERROR" }, errorStatus(error)); }
});
