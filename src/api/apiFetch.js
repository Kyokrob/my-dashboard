const API_BASE = import.meta.env.VITE_API_BASE || "";

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });

  if (res.status === 204) return null;

  if (res.status === 401) {
    try {
      if (window.location.pathname !== "/login") {
        sessionStorage.setItem("flash", "signed_out");
        window.location.assign("/login");
      }
    } catch {
      // ignore storage/navigation errors
    }
    throw new Error("Unauthorized");
  }

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    const msg =
      typeof data === "string"
        ? data
        : data?.message || res.statusText;
    throw new Error(msg);
  }

  return data;
}
