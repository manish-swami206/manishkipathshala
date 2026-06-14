function normalizeBaseUrl(baseUrl: string) {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

const BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
);

export type ApiErrorBody = { error?: string; message?: string };

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

type FetchOptions = Omit<RequestInit, "headers"> & {
  token?: string;
  headers?: HeadersInit;
};

function buildHeaders(options: FetchOptions) {
  const headers = new Headers();

  // Don't force JSON Content-Type for FormData — the browser needs to set
  // multipart/form-data with the correct boundary for file uploads.
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (options.headers) {
    const provided =
      options.headers instanceof Headers
        ? options.headers
        : new Headers(options.headers);
    provided.forEach((value, key) => headers.set(key, value));
  }

  // Only attach Bearer token when explicitly provided via options.token.
  // Public API routes do NOT need auth — only admin/auth-required routes pass a token.
  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  return headers;
}

function normalizePath(path: string) {
  if (path.startsWith("/api/")) return path.slice(4);
  if (path === "/api") return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const headers = buildHeaders(options);

  const url = `${BASE_URL}${normalizePath(path)}`;
  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const body = (await res
      .json()
      .catch((): ApiErrorBody & { details?: Array<{ path: (string | number)[]; message: string }> } => ({}))) as ApiErrorBody & {
      details?: Array<{ path: (string | number)[]; message: string }>;
    };
    let message = body.error ?? body.message ?? res.statusText;

    // Append field-level validation details for better UX
    if (body.details && Array.isArray(body.details) && body.details.length > 0) {
      const fieldErrors = body.details
        .map((d) => `${d.path?.join(".") || "?"}: ${d.message}`)
        .slice(0, 3)
        .join("; ");
      message = `${message} — ${fieldErrors}`;
    }

    throw new ApiError(res.status, message, body);
  }

  return (await res.json()) as T;
}
