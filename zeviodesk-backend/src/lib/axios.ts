/**
 * HTTP Client Wrapper (Axios / Fetch Interface)
 */

export const httpClient = {
  get: async <T>(url: string, headers?: Record<string, string>): Promise<T> => {
    const res = await fetch(url, { method: "GET", headers });
    if (!res.ok) throw new Error(`HTTP GET ${url} failed with status ${res.status}`);
    return res.json();
  },
  post: async <T>(url: string, body: any, headers?: Record<string, string>): Promise<T> => {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP POST ${url} failed with status ${res.status}`);
    return res.json();
  },
};
