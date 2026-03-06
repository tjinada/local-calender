const API_BASE = "/api";

export async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    headers: { "Content-Type": "application/json" },
    ...options,
  };

  if (config.body && typeof config.body === "object") {
    config.body = JSON.stringify(config.body);
  }

  const res = await fetch(url, config);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "API error");
  }
  return res.json();
}

export function useApi() {
  return {
    get: (path) => apiFetch(path),
    post: (path, body) => apiFetch(path, { method: "POST", body }),
    put: (path, body) => apiFetch(path, { method: "PUT", body }),
    del: (path) => apiFetch(path, { method: "DELETE" }),
  };
}
