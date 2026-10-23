const U = require("../../utils/page");
Page({
  onShow() {
    U.requireGame(this);
  },
  upgrade(e) {
    U.run(this, "UPGRADE", { id: e.currentTarget.dataset.id });
  },
  sell(e) {
    const id = e.currentTarget.dataset.id,
      a = this.data.assets.find((v) => v.tileId === id);
    wx.showModal({
      title: "出售" + a.name + "？",
      content:
        "回收 ¥" +
        a.salvage +
        "，之后不再获得这处资产的固定收益。升级支出不计入回收价。",
      confirmText: "确认出售",
      confirmColor: "#c74b36",
      success: (r) => {
        if (r.confirm) U.run(this, "SELL", { id });
      },
    });
  },
  back() {
    U.resume();
  },
});
