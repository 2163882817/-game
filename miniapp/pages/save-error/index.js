const U = require("../../utils/page");
Page({
  data: { busy: false, error: "" },
  onShow() {
    const app = getApp();
    this.setData({
      round: app.pending
        ? app.pending.snapshot.round
        : app.game
          ? app.game.round
          : 1,
    });
  },
  retry() {
    if (this.data.busy) return;
    this.setData({ busy: true, error: "" });
    try {
      getApp().retry();
      U.resume();
    } catch (e) {
      this.setData({ error: e.message });
    } finally {
      this.setData({ busy: false });
    }
  },
});
