const U = require("../../utils/page");
const E = require("../../engine/game");
Page({
  data: { shareOpen: false },
  onShow() {
    const app = getApp();
    if (!U.requireGame(this, ["ENDING"])) return;
    try {
      app.storage.archive(app.game);
    } catch (_) {
      wx.showToast({ title: "历史保存失败，请稍后重试。", icon: "none" });
    }
    this.setData({
      residual: app.game.assets.reduce((n, a) => n + E.salvage(a.level), 0),
      keyChoices: app.game.history.filter((h) => h.eventId).slice(-3),
    });
  },
  nav: U.nav,
  replay() {
    U.nav("new-game");
  },
  share() {
    this.setData({ shareOpen: !this.data.shareOpen });
  },
  onShareAppMessage() {
    return {
      title: "我在高性价比人生，走出了一条自己的路。",
      path: "/pages/home/index",
    };
  },
});
