import { ApiRequestError, apiRequest, type ApiRequestOptions } from "@/lib/api";

export type AdminRole =
  | "admin"
  | "super_admin"
  | "content_admin"
  | "integration_admin"
  | "analytics_viewer";

export type AdminStatus = "active" | "inactive" | "suspended" | "deleted";

export interface AdminUser {
  id?: string;
  _id?: string;
  email: string;
  fullName: string;
  role: AdminRole;
  status: AdminStatus;
  isEmailVerified?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AdminAuthData {
  user: AdminUser;
  tokens: AdminTokens;
}

export interface AdminAuthSession extends AdminAuthData {
  timestamp: string;
}

type LoginInput = {
  email: string;
  password: string;
};

type CreateAdminInput = {
  email: string;
  password: string;
  role?: AdminRole;
};

type AuthOptions = {
  persistSession?: boolean;
};

const ADMIN_AUTH_SESSION_KEY = "safespeak_admin_auth_session";
const TOKEN_REFRESH_SKEW_SECONDS = 30;
let refreshAdminSessionPromise: Promise<AdminAuthData> | null = null;

function getStorage(persistSession: boolean): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  return persistSession ? window.localStorage : window.sessionStorage;
}

export function clearAdminAuthSession(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ADMIN_AUTH_SESSION_KEY);
  window.sessionStorage.removeItem(ADMIN_AUTH_SESSION_KEY);
}

export function saveAdminAuthSession(session: AdminAuthSession, persistSession = true): void {
  const storage = getStorage(persistSession);

  if (!storage) {
    return;
  }

  clearAdminAuthSession();
  storage.setItem(ADMIN_AUTH_SESSION_KEY, JSON.stringify(session));
}

export function getAdminAuthSession(): AdminAuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(ADMIN_AUTH_SESSION_KEY)
    ?? window.localStorage.getItem(ADMIN_AUTH_SESSION_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AdminAuthSession;
  }
  catch {
    clearAdminAuthSession();
    return null;
  }
}

export function getAdminAccessToken(): string | null {
  return getAdminAuthSession()?.tokens.accessToken ?? null;
}

function getAdminSessionStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  if (window.sessionStorage.getItem(ADMIN_AUTH_SESSION_KEY)) {
    return window.sessionStorage;
  }

  if (window.localStorage.getItem(ADMIN_AUTH_SESSION_KEY)) {
    return window.localStorage;
  }

  return null;
}

function decodeJwtPayload(token: string): { exp?: number } | null {
  const payload = token.split(".")[1];

  if (!payload) {
    return null;
  }

  try {
    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      "=",
    );

    return JSON.parse(window.atob(paddedPayload)) as { exp?: number };
  }
  catch {
    return null;
  }
}

function isTokenExpired(token: string, skewSeconds = 0): boolean {
  const payload = decodeJwtPayload(token);

  if (!payload?.exp) {
    return true;
  }

  return payload.exp * 1000 <= Date.now() + skewSeconds * 1000;
}

export function isAdminAccessTokenExpired(): boolean {
  const token = getAdminAccessToken();

  return !token || isTokenExpired(token, TOKEN_REFRESH_SKEW_SECONDS);
}

export async function refreshAdminSession(): Promise<AdminAuthData> {
  if (refreshAdminSessionPromise) {
    return refreshAdminSessionPromise;
  }

  const session = getAdminAuthSession();

  if (!session?.tokens.refreshToken) {
    clearAdminAuthSession();
    throw new Error("Admin login is required.");
  }

  if (isTokenExpired(session.tokens.refreshToken)) {
    clearAdminAuthSession();
    throw new Error("Admin session expired. Please login again.");
  }

  refreshAdminSessionPromise = (async () => {
    const response = await apiRequest<AdminAuthData>("/auth/refresh", {
      method: "POST",
      body: {
        refreshToken: session.tokens.refreshToken,
      },
    });
    const storage = getAdminSessionStorage();
    const nextSession = {
      ...response.data,
      timestamp: response.timestamp ?? new Date().toISOString(),
    };

    clearAdminAuthSession();
    (storage ?? window.localStorage).setItem(ADMIN_AUTH_SESSION_KEY, JSON.stringify(nextSession));

    return response.data;
  })();

  try {
    return await refreshAdminSessionPromise;
  }
  catch (error) {
    clearAdminAuthSession();
    throw error;
  }
  finally {
    refreshAdminSessionPromise = null;
  }
}

export async function ensureValidAdminSession(): Promise<AdminAuthSession | null> {
  const session = getAdminAuthSession();

  if (!session) {
    return null;
  }

  if (!isAdminAccessTokenExpired()) {
    return session;
  }

  await refreshAdminSession();
  return getAdminAuthSession();
}

export async function getValidAdminAccessToken(): Promise<string> {
  const session = await ensureValidAdminSession();
  const token = session?.tokens.accessToken;

  if (!token) {
    throw new Error("Admin login is required.");
  }

  return token;
}

function shouldRefreshAfterError(error: unknown): boolean {
  if (!(error instanceof ApiRequestError)) {
    return false;
  }

  return error.status === 401 || /jwt expired|token/i.test(error.message);
}

export async function adminApiRequest<TData>(
  path: string,
  options: Omit<ApiRequestOptions, "token"> = {},
) {
  const token = await getValidAdminAccessToken();

  try {
    return await apiRequest<TData>(path, {
      ...options,
      token,
    });
  }
  catch (error) {
    if (!shouldRefreshAfterError(error)) {
      throw error;
    }

    const refreshed = await refreshAdminSession();

    return apiRequest<TData>(path, {
      ...options,
      token: refreshed.tokens.accessToken,
    });
  }
}

export async function loginAdmin(
  input: LoginInput,
  options: AuthOptions = {},
): Promise<AdminAuthData> {
  const response = await apiRequest<AdminAuthData>("/auth/admin/login", {
    method: "POST",
    body: input,
  });
  const session = {
    ...response.data,
    timestamp: response.timestamp ?? new Date().toISOString(),
  };

  saveAdminAuthSession(session, options.persistSession ?? true);
  return response.data;
}

export async function createAdminUser(input: CreateAdminInput): Promise<AdminUser> {
  const response = await adminApiRequest<{ user: AdminUser }>("/admin/users", {
    method: "POST",
    body: {
      email: input.email,
      password: input.password,
      role: input.role ?? "content_admin",
    },
  });

  return response.data.user;
}
