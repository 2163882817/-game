const U = require("../../utils/page");
Page({
  data: { busy: false },
  start() {
    if (this.data.busy) return;
    this.setData({ busy: true });
    try {
      getApp().start();
      U.resume();
    } catch (e) {
      wx.showToast({ title: e.message, icon: "none" });
      this.setData({ busy: false });
    }
  },
});
