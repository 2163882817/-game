const C = require("../../content/index");
Page({
  data: { item: null, saved: false },
  onLoad(options) {
    const item = C.knowledge.find((k) => k.id === options.id);
    this.setData({ item });
    if (item) {
      const app = getApp(),
        read = app.storage.list("read");
      if (!read.includes(item.id)) {
        try {
          app.storage.write("read", read.concat(item.id));
        } catch (_) {}
      }
      this.sync();
    }
  },
  sync() {
    this.setData({
      saved: getApp().storage.list("favorites").includes(this.data.item.id),
    });
  },
  favorite() {
    try {
      const app = getApp(),
        ids = app.storage.list("favorites"),
        id = this.data.item.id;
      app.storage.write(
        "favorites",
        ids.includes(id) ? ids.filter((v) => v !== id) : ids.concat(id),
      );
      if (!ids.includes(id)) {
        const unlocked = app.storage.list("achievements");
        if (!unlocked.includes("learn"))
          app.storage.write("achievements", unlocked.concat("learn"));
      }
      this.sync();
    } catch (_) {
      wx.showToast({ title: "收藏保存失败，请重试。", icon: "none" });
    }
  },
  feedback() {
    wx.navigateTo({
      url:
        "/pages/feedback/index?knowledgeId=" +
        encodeURIComponent(this.data.item.id),
    });
  },
  copy() {
    wx.setClipboardData({
      data: this.data.item.sourceUrl,
      fail() {
        wx.showToast({ title: "复制失败，请稍后重试。", icon: "none" });
      },
    });
  },
});
