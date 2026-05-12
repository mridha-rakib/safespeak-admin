export interface ApiEnvelope<TData> {
  success: boolean;
  message: string;
  data: TData;
  meta?: unknown;
  timestamp?: string;
  requestId?: string;
  errors?: unknown[];
  errorCode?: string;
}

export type ApiRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  token?: string;
  baseUrl?: string;
  headers?: HeadersInit;
};

const DEFAULT_API_BASE_URL = "http://localhost:5000/api/v1";

function normalizeApiBaseUrl(value: string): string {
  const trimmedValue = value.trim().replace(/\/+$/, "");

  try {
    const url = new URL(trimmedValue);

    if (url.pathname === "" || url.pathname === "/") {
      url.pathname = "/api/v1";
    }

    return url.toString().replace(/\/+$/, "");
  } catch {
    return trimmedValue;
  }
}

export class ApiRequestError extends Error {
  status: number;
  errors?: unknown[];
  requestId?: string;
  errorCode?: string;
  data?: unknown;
  meta?: unknown;
  timestamp?: string;

  constructor(
    message: string,
    status: number,
    options: {
      errors?: unknown[];
      requestId?: string;
      errorCode?: string;
      data?: unknown;
      meta?: unknown;
      timestamp?: string;
    } = {},
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.errors = options.errors;
    this.requestId = options.requestId;
    this.errorCode = options.errorCode;
    this.data = options.data;
    this.meta = options.meta;
    this.timestamp = options.timestamp;
  }
}

export function getApiBaseUrl(explicit?: string): string {
  const value =
    explicit ?? import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;

  return normalizeApiBaseUrl(value);
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function apiRequest<TData>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<ApiEnvelope<TData>> {
  const baseUrl = getApiBaseUrl(options.baseUrl);
  const isFormData = options.body instanceof FormData;
  const headers = new Headers(options.headers);

  if (!isFormData && options.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const requestBody: BodyInit | undefined =
    options.body === undefined
      ? undefined
      : options.body instanceof FormData
        ? options.body
        : JSON.stringify(options.body);

  const response = await fetch(
    `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`,
    {
      method: options.method ?? "GET",
      headers,
      body: requestBody,
    },
  );
  const payload = (await parseJsonSafe(response)) as Partial<
    ApiEnvelope<TData>
  > | null;
  const requestId = response.headers.get("x-request-id") ?? payload?.requestId;
  const message =
    payload?.message ??
    `${response.status} ${response.statusText || "Request failed"}`;

  if (!response.ok || !payload?.success) {
    throw new ApiRequestError(message, response.status, {
      errors: payload?.errors,
      requestId,
      errorCode: payload?.errorCode,
      data: payload?.data,
      meta: payload?.meta,
      timestamp: payload?.timestamp,
    });
  }

  return {
    success: true,
    message,
    data: payload.data as TData,
    meta: payload.meta,
    timestamp: payload.timestamp,
    requestId,
    errorCode: payload.errorCode,
  };
}
