const LOCAL_API_ORIGIN = "http://127.0.0.1:4000";
const CALENDAR_ID_STORAGE_KEY = "happy-calendar-id";

function trimTrailingSlash(value: string) {
  return value.replace(/\/$/, "");
}

function createCalendarId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `calendar_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getCalendarId() {
  if (typeof window === "undefined") {
    return "server-calendar";
  }

  const existingCalendarId = window.localStorage.getItem(CALENDAR_ID_STORAGE_KEY);

  if (existingCalendarId) {
    return existingCalendarId;
  }

  const calendarId = createCalendarId();
  window.localStorage.setItem(CALENDAR_ID_STORAGE_KEY, calendarId);
  return calendarId;
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
  const headers = new Headers(options?.headers);
  headers.set("Content-Type", "application/json");
  headers.set("X-Calendar-Id", getCalendarId());

  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}
