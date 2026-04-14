const LOCAL_API_ORIGIN = "http://127.0.0.1:4000";

function trimTrailingSlash(value: string) {
  return value.replace(/\/$/, "");
}

export function getApiBaseUrl() {
  const configuredApiUrl = import.meta.env.VITE_API_URL;

  if (configuredApiUrl) {
    return trimTrailingSlash(configuredApiUrl);
  }

  if (typeof window === "undefined") {
    return LOCAL_API_ORIGIN;
  }

  if (window.location.port === "5173") {
    return LOCAL_API_ORIGIN;
  }

  return window.location.origin;
}

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

export async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}
