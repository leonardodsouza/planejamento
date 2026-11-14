/* global Planejamento */
const P = Planejamento;
const $ = (sel) => document.querySelector(sel);

const PRIORITY = { 1: "Baixa", 2: "Média", 3: "Alta" };
let when = "today"; // today | tomorrow | none | date

function show(id) {
  $("#login").hidden = id !== "login";
  $("#main").hidden = id !== "main";
}

function setError(el, err) {
  el.textContent = err ? err.message || String(err) : "";
  el.hidden = !err;
}

/** Se o token venceu, volta para a tela de login. */
function handle(err, el) {
  if (err && err.status === 401) return start();
  setError(el, err);
}

// ---------- Login ----------

$("#login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const btn = f.querySelector("button");
  btn.disabled = true;
  setError($("#login-error"), null);
  try {
    await P.login(f.server.value, f.email.value.trim(), f.password.value);
    f.password.value = "";
    await openMain();
  } catch (err) {
    setError($("#login-error"), err);
  } finally {
    btn.disabled = false;
  }
});

// ---------- Nova tarefa ----------

function selectWhen(value) {
  when = value;
  for (const b of $("#when").querySelectorAll("button")) b.classList.toggle("on", b.dataset.when === value);
  const date = $("#task-form").date;
  date.classList.toggle("on", value === "date");
  if (value !== "date") date.value = "";
}

$("#when").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-when]");
  if (b) selectWhen(b.dataset.when);
});
$("#task-form").date.addEventListener("change", (e) => selectWhen(e.target.value ? "date" : "none"));

function dueDate() {
  if (when === "today") return P.isoDate(0);
  if (when === "tomorrow") return P.isoDate(1);
  if (when === "date") return $("#task-form").date.value || null;
  return null;
}

$("#task-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target;
  const btn = f.querySelector("button[type=submit]");
  btn.disabled = true;
  setError($("#task-error"), null);
  $("#task-ok").hidden = true;
  try {
    await P.createTask({
      title: f.title.value.trim(),
      description: f.description.value.trim() || null,
      due_date: dueDate(),
      project_id: f.project_id.value || null,
      priority: Number(f.priority.value),
    });
    f.title.value = "";
    f.description.value = "";
    $("#task-ok").hidden = false;
    setTimeout(() => ($("#task-ok").hidden = true), 2500);
    await loadTasks();
  } catch (err) {
    handle(err, $("#task-error"));
  } finally {
    btn.disabled = false;
  }
});

/** Preenche título e notas com a página aberta. */
async function prefillFromTab() {
  try {
    const [tab] = await P.ext.tabs.query({ active: true, currentWindow: true });
    if (!tab) return;
    const f = $("#task-form");
    if (tab.title) f.title.value = tab.title.slice(0, 200);
    if (tab.url && /^https?:/.test(tab.url)) f.description.value = tab.url;
    f.title.select();
  } catch {
    /* sem acesso à aba: deixa em branco */
  }
}

// ---------- Lista de hoje ----------

function formatLate(iso) {
  const days = Math.round((new Date(P.isoDate(0)) - new Date(iso)) / 86_400_000);
  return days === 1 ? "atrasada 1 dia" : `atrasada ${days} dias`;
}

function renderTasks(tasks) {
  const today = P.isoDate(0);
  const ul = $("#tasks");
  ul.replaceChildren();
  for (const t of tasks) {
    const li = document.createElement("li");
    li.classList.toggle("done", t.status === "done");

    const box = document.createElement("input");
    box.type = "checkbox";
    box.checked = t.status === "done";
    box.setAttribute("aria-label", "Concluir " + t.title);
    box.addEventListener("change", async () => {
      li.classList.toggle("done", box.checked);
      try {
        await P.setDone(t.id, box.checked);
        updateCount();
      } catch (err) {
        box.checked = !box.checked;
        li.classList.toggle("done", box.checked);
        handle(err, $("#task-error"));
      }
    });

    const text = document.createElement("span");
    text.className = "t";
    text.textContent = t.title;
    const meta = document.createElement("span");
    meta.className = "meta";
    const parts = [];
    if (t.status !== "done" && t.due_date < today) {
      meta.classList.add("late");
      parts.push(formatLate(t.due_date));
    }
    if (t.priority === 3) parts.push("prioridade " + PRIORITY[3].toLowerCase());
    if (t.project_name) {
      const dot = document.createElement("span");
      dot.className = "dot";
      dot.style.background = t.project_color || "#6366f1";
      meta.append(dot, t.project_name + (parts.length ? " · " : ""));
    }
    meta.append(parts.join(" · "));
    if (meta.textContent) text.append(meta);

    li.append(box, text);
    ul.append(li);
  }
  $("#empty").hidden = tasks.length > 0;
  updateCount();
}

function updateCount() {
  const items = [...document.querySelectorAll("#tasks li")];
  const open = items.filter((li) => !li.classList.contains("done")).length;
  $("#count").textContent = items.length ? `(${open} pendente${open === 1 ? "" : "s"})` : "";
}

async function loadTasks() {
  const { tasks } = await P.todayTasks();
  renderTasks(tasks);
}

// ---------- Início ----------

async function openMain() {
  const cfg = await P.getConfig();
  show("main");
  $("#who").textContent = cfg.email;
  $("#who").title = cfg.email;
  $("#open-app").href = cfg.server + "/hoje";
  prefillFromTab();
  try {
    const [me] = await Promise.all([P.me(), loadTasks()]);
    const select = $("#task-form").project_id;
    select.length = 1;
    for (const p of me.projects) select.add(new Option(p.name, p.id));
  } catch (err) {
    handle(err, $("#task-error"));
  }
}

$("#open-app").addEventListener("click", async (e) => {
  e.preventDefault();
  await P.ext.tabs.create({ url: e.currentTarget.href });
  window.close();
});

$("#logout").addEventListener("click", async () => {
  await P.logout();
  start();
});

async function start() {
  const cfg = await P.getConfig();
  if (cfg.server && cfg.token) return openMain();
  const f = $("#login-form");
  if (cfg.server) f.server.value = cfg.server;
  if (cfg.email) f.email.value = cfg.email;
  show("login");
  (cfg.server ? f.email : f.server).focus();
}

start();
