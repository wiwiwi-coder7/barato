import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { GiftRecord } from "./gift";
import type { BirthdayCakePreset, BirthdayPublicSettings } from "./publicBirthday";

const API_ROOT = "https://qqafgmkxqzjpppczzrac.supabase.co/functions/v1/barato-api";
const PUBLISHABLE_KEY = "sb_publishable_Wz1ZzslBy-YqnHlU9CxG-g_MpIADxML";
const ADMIN_TOKEN = "barato_admin_token";
const IMAGE_TOKEN = "barato_image_token";

type RequestOptions = { method?: "GET" | "POST" | "PATCH" | "DELETE"; input?: unknown; query?: Record<string, string> };

export class BaratoApiError extends Error { constructor(public readonly status: number, message: string) { super(message); } }
export type CreatedGiftRecord = GiftRecord & { creatorToken: string };
export type GiftLinkEvent = {
  id: number;
  eventType: "created" | "opened";
  ipAddress: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  browser: string | null;
  operatingSystem: string | null;
  device: string | null;
  createdAt: string;
};

function readAdminToken() { return localStorage.getItem(ADMIN_TOKEN) ?? ""; }
function readImageToken() { return localStorage.getItem(IMAGE_TOKEN) ?? ""; }
function endpoint(action: string, query?: Record<string, string>) { const value = new URL(API_ROOT); value.searchParams.set("action", action); Object.entries(query ?? {}).forEach(([key, item]) => value.searchParams.set(key, item)); return value.toString(); }

async function api<T = any>(action: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(endpoint(action, options.query), { method: options.method ?? "GET", headers: { apikey: PUBLISHABLE_KEY, "Content-Type": "application/json", ...(readAdminToken() ? { "x-admin-token": readAdminToken() } : {}), ...(readImageToken() ? { "x-image-token": readImageToken() } : {}) }, ...(options.input === undefined ? {} : { body: JSON.stringify(options.input) }) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new BaratoApiError(response.status, payload.error ?? "درخواست انجام نشد.");
  return payload as T;
}

function queryHook<T = any>(key: string, action: string, mapper: (payload: any) => T = payload => payload) {
  return (input?: any, options?: any) => useQuery<T>({ queryKey: [key, input], queryFn: () => api(action, { query: input?.token ? { token: input.token } : undefined }).then(mapper), ...options, enabled: options?.enabled, refetchInterval: options?.refetchInterval });
}
function mutationHook<T = any>(key: string, action: string, method: RequestOptions["method"] = "POST", mapper: (payload: any) => T = payload => payload, before?: (input: any) => RequestOptions) {
  return (options?: any) => useMutation<T, Error, any>({ mutationKey: [key], mutationFn: input => api(action, before ? before(input) : { method, input }).then(mapper), ...options });
}

function useAdminLogin(options?: any) { return useMutation<any, Error, { password: string }>({ mutationKey: ["admin-login"], mutationFn: async input => { const result = await api<any>("admin-login", { method: "POST", input }); localStorage.setItem(ADMIN_TOKEN, result.token); return { success: true }; }, ...options }); }
function useAdminLogout(options?: any) { return useMutation<any, Error, void>({ mutationKey: ["admin-logout"], mutationFn: async () => { try { await api("admin-logout", { method: "POST" }); } finally { localStorage.removeItem(ADMIN_TOKEN); } return { success: true }; }, ...options }); }
function useAdminPasswordChange(options?: any) { return useMutation<any, Error, { currentPassword: string; newPassword: string; confirmPassword: string }>({ mutationKey: ["admin-change-password"], mutationFn: async input => { await api("admin-change-password", { method: "POST", input }); localStorage.removeItem(ADMIN_TOKEN); return { success: true }; }, ...options }); }
function useImageUnlock(options?: any) { return useMutation<any, Error, { password: string }>({ mutationKey: ["unlock-image"], mutationFn: async input => { const result = await api<any>("unlock-image", { method: "POST", input }); localStorage.setItem(IMAGE_TOKEN, result.token); return { success: true }; }, ...options }); }
function useAdminLinkEvents(input?: { giftId?: number }, options?: any) { return useQuery<{ events: GiftLinkEvent[] }>({ queryKey: ["admin-link-events", input?.giftId], queryFn: () => api("admin-link-events", { query: { id: String(input?.giftId) } }), enabled: Boolean(input?.giftId) && options?.enabled !== false, ...options }); }

export const standaloneApi = {
  gifts: {
    warm: { useMutation: mutationHook("gift-warm", "warm", "GET") },
    create: { useMutation: mutationHook<CreatedGiftRecord>("gift-create", "create-gift", "POST", payload => ({ ...payload.gift, creatorToken: payload.creatorToken })) },
    getByToken: { useQuery: queryHook("gift-token", "get-gift", payload => payload.gift) },
    recordVisit: { useMutation: mutationHook("gift-visit", "record-visit") },
    unlockImage: { useMutation: useImageUnlock },
    uploadImage: { useMutation: mutationHook("gift-image", "upload-image") },
    attachImage: { useMutation: mutationHook<GiftRecord>("gift-attach-image", "attach-image", "POST", payload => payload.gift) },
  },
  birthday: {
    get: { useQuery: queryHook("birthday", "birthday", payload => payload.content) },
    presets: { useQuery: queryHook<BirthdayCakePreset[]>("birthday-cake-presets", "birthday-cake-presets", payload => payload.presets) },
    settings: { useQuery: queryHook<BirthdayPublicSettings>("birthday-public-settings", "birthday-public-settings", payload => payload.settings) },
  },
  admin: {
    login: { useMutation: useAdminLogin }, logout: { useMutation: useAdminLogout },
    changePassword: { useMutation: useAdminPasswordChange },
    session: { useQuery: queryHook("admin-session", "admin-session") },
    list: { useQuery: queryHook("admin-gifts", "admin-gifts", payload => payload.gifts) },
    linkEvents: { useQuery: useAdminLinkEvents },
    analytics: { useQuery: queryHook("admin-analytics", "admin-analytics") },
    birthday: {
      get: { useQuery: queryHook("admin-birthday", "admin-birthday", payload => payload.content) },
      update: { useMutation: mutationHook("admin-birthday-update", "admin-update-birthday", "PATCH", payload => payload.content) },
      publicSettings: {
        get: { useQuery: queryHook<BirthdayPublicSettings>("admin-birthday-public-settings", "admin-birthday-public-settings", payload => payload.settings) },
        update: { useMutation: mutationHook<BirthdayPublicSettings>("admin-birthday-public-settings-update", "admin-update-birthday-public-settings", "PATCH", payload => payload.settings) },
      },
      presets: {
        list: { useQuery: queryHook<BirthdayCakePreset[]>("admin-birthday-presets", "admin-birthday-presets", payload => payload.presets) },
        create: { useMutation: mutationHook<BirthdayCakePreset>("admin-birthday-preset-create", "admin-create-birthday-preset", "POST", payload => payload.preset) },
        update: { useMutation: mutationHook<BirthdayCakePreset>("admin-birthday-preset-update", "admin-update-birthday-preset", "PATCH", payload => payload.preset) },
        delete: { useMutation: mutationHook("admin-birthday-preset-delete", "admin-delete-birthday-preset", "DELETE", payload => payload, input => ({ method: "DELETE", query: { id: String(input.id) } })) },
      },
    },
    update: { useMutation: mutationHook("admin-gift-update", "admin-update-gift", "PATCH", payload => payload.gift) },
    delete: { useMutation: mutationHook("admin-gift-delete", "admin-delete-gift", "DELETE", payload => payload, input => ({ method: "DELETE", query: { id: String(input.id) } })) },
  },
  auth: {
    me: { useQuery: queryHook("auth-me", "admin-session", () => null) },
    logout: { useMutation: (options?: any) => useMutation<any, Error, void>({ mutationKey: ["auth-logout"], mutationFn: async () => { try { await api("admin-logout", { method: "POST" }); } finally { localStorage.removeItem(ADMIN_TOKEN); } return { success: true }; }, ...options }) },
  },
  useUtils() {
    const queryClient = useQueryClient();
    const invalidate = (key: string) => ({ invalidate: () => queryClient.invalidateQueries({ queryKey: [key] }) });
    const auth = { me: { invalidate: () => queryClient.invalidateQueries({ queryKey: ["auth-me"] }), setData: (_input: unknown, data: unknown) => queryClient.setQueryData(["auth-me", undefined], data) } };
    return { auth, admin: { session: invalidate("admin-session"), list: invalidate("admin-gifts"), analytics: invalidate("admin-analytics"), birthday: { get: invalidate("admin-birthday"), publicSettings: invalidate("admin-birthday-public-settings"), presets: invalidate("admin-birthday-presets") } }, gifts: { getByToken: invalidate("gift-token") } };
  },
};
