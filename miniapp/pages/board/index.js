const U = require("../../utils/page");
const C = require("../../content/index");
Page({
  data: { moving: false, displayPosition: 0, dice: 0 },
  onShow() {
    if (!U.requireGame(this, ["READY", "MOVING"])) return;
    this.setData({ displayPosition: this.data.game.position });
    if (this.data.game.phase === "MOVING") this.animate();
  },
  onHide() {
    this.clear();
  },
  onUnload() {
    this.clear();
  },
  clear() {
    clearTimeout(this.timer);
    this.timer = null;
  },
  nav: U.nav,
  roll() {
    if (this.data.moving) return;
    if (U.run(this, "ROLL")) this.animate();
  },
  animate() {
    this.clear();
    const g = getApp().game;
    if (!g || g.phase !== "MOVING") return;
    this.setData({ moving: true, dice: g.roll.dice });
    let i = 0;
    const step = () => {
      this.setData({ displayPosition: g.roll.path[i++] });
      if (i < g.roll.path.length) this.timer = setTimeout(step, 250);
      else this.timer = setTimeout(() => this.land(), 350);
    };
    this.timer = setTimeout(step, 200);
  },
  land() {
    this.clear();
    if (U.run(this, "LAND")) {
      this.setData({ moving: false });
      U.resume();
    }
  },
  tile(e) {
    const t = C.board[e.detail.id];
    wx.showModal({
      title: t.number + " · " + t.name,
      content: {
        start: "经过或落在起点：工资 ¥2,000 + 已持有资产固定收益。",
        asset: "可选购入，买入 ¥3,000；每次经过起点发放收益。",
        event: "遇见生活情境，查看成本后作出选择。",
        park: "精力 +8（上限100）。",
        work: "现金 +600，精力 −8。",
        rest: "健康 +8（上限100）。",
        supply: "现金 −200，精力 +15。",
        bill: "缴纳生活费用 ¥300。",
        protection: "可以支付 ¥200，提升游戏保障 +10；允许跳过。",
      }[t.type],
      showCancel: false,
    });
  },
});
