const U = require("../../utils/page");
Page({
  data: { busy: false, showGuide: true },
  onShow() {
    this.setData({
      busy: false,
      showGuide: !getApp().storage.list("onboarding").includes("v1"),
    });
  },
  toggleGuide() {
    this.setData({ showGuide: !this.data.showGuide });
  },
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
