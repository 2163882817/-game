const C = require("../../content/index");
const U = require("../../utils/page");
Page({
  data: { tab: "history", selected: null },
  onShow() {
    const app = getApp();
    const histories = app.storage.list("history");
    let ids = app.storage.list("achievements");
    const g = app.game,
      unlocked = [];
    if (g) {
      if (g.history.length) unlocked.push("first");
      if (g.stageReports.length) unlocked.push("stage");
      if (g.phase === "ENDING") unlocked.push("finish");
      if (g.assets.length) unlocked.push("asset");
      if (g.upgraded) unlocked.push("upgrade");
    }
    if (histories.length >= 2) unlocked.push("replay");
    if (app.storage.list("read").length >= C.knowledge.length)
      unlocked.push("explore");
    ids = Array.from(new Set(ids.concat(unlocked)));
    try {
      app.storage.write("achievements", ids);
    } catch (_) {}
    this.setData({
      histories: histories.map((h) => ({
        ...h,
        date: new Date(h.updatedAt).toLocaleDateString(),
      })),
      badges: C.achievements.map((a) => ({
        ...a,
        unlocked: ids.includes(a.id),
      })),
    });
  },
  tab(e) {
    this.setData({ tab: e.currentTarget.dataset.tab, selected: null });
  },
  detail(e) {
    this.setData({
      selected: this.data.histories.find(
        (h) => h.gameId === e.currentTarget.dataset.id,
      ),
    });
  },
  close() {
    this.setData({ selected: null });
  },
  nav: U.nav,
});
