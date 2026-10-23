const C = require("../content/index");
const E = require("../engine/game");
const money = (n) => Number(n).toLocaleString("en-US");
function view(g) {
  if (!g) return {};
  return {
    game: g,
    resources: g.resources,
    cash: money(g.resources.cash),
    stageName: C.stages[g.stage - 1],
    tile: C.board[g.position],
    assets: g.assets.map((a) => ({
      ...a,
      name: C.board[a.tileId].name,
      income: E.income(a.level),
      cost: E.upgradeCost(a.level),
      salvage: E.salvage(a.level),
      canUpgrade:
        ["READY", "RESULT"].includes(g.phase) &&
        g.history.length > 0 &&
        a.level < 3 &&
        a.lastUpgradeRound !== g.round &&
        g.resources.cash >= E.upgradeCost(a.level),
    })),
    income: g.assets.reduce((n, a) => n + E.income(a.level), 0),
  };
}
function refresh(page) {
  const app = getApp();
  page.setData(view(app.game));
  return app;
}
function run(page, type, payload) {
  try {
    const app = getApp();
    app.dispatch(type, payload);
    refresh(page);
    return true;
  } catch (error) {
    wx.showToast({ title: error.message, icon: "none" });
    return false;
  }
}
function resume() {
  wx.reLaunch({ url: getApp().resumeUrl() });
}
function nav(e) {
  const route = typeof e === "string" ? e : e.currentTarget.dataset.page;
  wx.navigateTo({ url: "/pages/" + route + "/index" });
}
function requireGame(page, phases) {
  const app = refresh(page);
  if (!app.game || (phases && !phases.includes(app.game.phase))) {
    resume();
    return false;
  }
  return true;
}
module.exports = { view, refresh, run, resume, nav, requireGame, money };
