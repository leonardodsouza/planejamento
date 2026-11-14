/* global Planejamento, importScripts */
// Menu do botão direito: "Adicionar ao Planejamento" (texto selecionado, link ou página).
// A tarefa entra em "Sem data" (Entrada) e o ícone mostra ✓ ou ! por alguns segundos.
importScripts("api.js");
const P = Planejamento;
const MENU_ID = "planejamento-add";

function createMenu() {
  P.ext.contextMenus.removeAll(() => {
    P.ext.contextMenus.create({
      id: MENU_ID,
      title: "Adicionar ao Planejamento",
      contexts: ["page", "selection", "link"],
    });
  });
}
P.ext.runtime.onInstalled.addListener(createMenu);
P.ext.runtime.onStartup?.addListener(createMenu);

function flash(text, color) {
  const action = P.ext.action;
  action.setBadgeBackgroundColor?.({ color });
  action.setBadgeText({ text });
  setTimeout(() => action.setBadgeText({ text: "" }), 3000);
}

P.ext.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID) return;
  const { token } = await P.getConfig();
  if (!token) {
    flash("!", "#dc2626");
    return;
  }
  const selection = (info.selectionText || "").trim();
  const url = info.linkUrl || info.pageUrl || tab?.url || "";
  const title = selection || (info.linkUrl ? info.linkText || info.linkUrl : tab?.title) || url;
  try {
    await P.createTask({
      title: title.slice(0, 200),
      description: url || null,
      due_date: null,
      priority: 2,
    });
    flash("✓", "#16a34a");
  } catch {
    flash("!", "#dc2626");
  }
});
