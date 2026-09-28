/* Talks to the Maitri server. All data lives on the server (state.json + uploads/),
   so students, tasks and files stay until the admin deletes them, on every device. */

const TOKEN_KEY = "maitri-admin-token";

export const getToken = () => {
  try { return sessionStorage.getItem(TOKEN_KEY) || ""; } catch { return ""; }
};
export const setToken = (t) => {
  try { t ? sessionStorage.setItem(TOKEN_KEY, t) : sessionStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
};

async function request(path, { method = "GET", json, body, headers = {} } = {}) {
  const token = getToken();
  const res = await fetch(path, {
    method,
    headers: {
      ...(json ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: json ? JSON.stringify(json) : body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) setToken(""); // session expired
    throw Object.assign(new Error(data.error || `Request failed (${res.status})`), { status: res.status });
  }
  return data;
}

export const fetchState = () => request("/api/state");

export async function login(password) {
  const { token } = await request("/api/login", { method: "POST", json: { password } });
  setToken(token);
}
export const logout = () => setToken("");

export const saveState = (slices) => request("/api/state", { method: "PUT", json: slices });

export const changePassword = (current, next) => request("/api/password", { method: "POST", json: { current, next } });

export const postGrammarScore = (childId, topicId, score) =>
  request("/api/grammar-score", { method: "POST", json: { childId, topicId, score } });

export const uploadFile = (file) =>
  request("/api/upload", { method: "POST", body: file, headers: { "Content-Type": file.type } });
