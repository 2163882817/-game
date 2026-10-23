const U = require("../../utils/page");
const C = require("../../content/index");
const labels = {
  cash: "现金",
  energy: "精力",
  health: "健康",
  protection: "保障",
};
Page({
  data: { expanded: false },
  onShow() {
    if (!U.requireGame(this, ["RESULT"])) return;
    const r = this.data.game.result;
    this.setData({
      result: r,
      knowledge: C.knowledge.find((k) => k.id === r.knowledgeId),
      changes: r.changes.map((c) => ({
        ...c,
        label: labels[c.key],
        deltaText: (c.delta > 0 ? "+" : "") + c.delta,
      })),
    });
  },
  toggle() {
    this.setData({ expanded: !this.data.expanded });
  },
  guide() {
    wx.navigateTo({
      url: "/pages/guide-detail/index?id=" + this.data.result.knowledgeId,
    });
  },
  nav: U.nav,
  next() {
    if (U.run(this, "NEXT")) U.resume();
  },
});
