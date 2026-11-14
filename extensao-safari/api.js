// Comunicação com o app Planejamento. Usado pelo popup e pelo background.
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- global usado por popup.js e background.js
var Planejamento = (() => {
  const ext = globalThis.browser ?? globalThis.chrome;

  async function getConfig() {
    const { server = "", token = "", email = "" } = await ext.storage.local.get(["server", "token", "email"]);
    return { server, token, email };
  }

  /** "planejamento.x.workers.dev/" -> "https://planejamento.x.workers.dev" */
  function normalizeServer(raw) {
    let s = String(raw || "").trim();
    if (!s) return "";
    if (!/^https?:\/\//i.test(s)) s = "https://" + s;
    try {
      return new URL(s).origin;
    } catch {
      return "";
    }
  }

  async function request(path, { method = "GET", body, server } = {}) {
    const cfg = await getConfig();
    server = server || cfg.server;
    const token = path === "/login" ? "" : cfg.token;
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = "Bearer " + token;
    let res;
    try {
      res = await fetch(server + "/api/ext" + path, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw Object.assign(new Error("Não consegui falar com o servidor. Confira o endereço e a internet."), { status: 0 });
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401 && path !== "/login") await ext.storage.local.remove(["token"]);
      throw Object.assign(new Error(data.error || `Erro ${res.status}`), { status: res.status });
    }
    return data;
  }

  /** Data de hoje (AAAA-MM-DD) no fuso deste aparelho, com deslocamento em dias. */
  function isoDate(offsetDays = 0) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }

  return {
    ext,
    getConfig,
    normalizeServer,
    isoDate,

    async login(rawServer, email, password) {
      const server = normalizeServer(rawServer);
      if (!server) throw new Error("Informe o endereço do Planejamento.");
      const data = await request("/login", { method: "POST", server, body: { email, password } });
      await ext.storage.local.set({ server, token: data.token, email: data.email });
      return data;
    },

    async logout() {
      await request("/logout", { method: "POST" }).catch(() => {});
      await ext.storage.local.remove(["token", "email"]);
    },

    me: () => request("/me"),
    todayTasks: () => request("/tasks?today=" + isoDate()),
    createTask: (task) => request("/tasks", { method: "POST", body: task }),
    setDone: (id, done) => request("/tasks/" + encodeURIComponent(id), { method: "PATCH", body: { status: done ? "done" : "todo" } }),
  };
})();
