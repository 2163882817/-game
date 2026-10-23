const C = require("../../content/index");
Page({
  data: { text: "", saved: false, knowledgeId: "" },
  onLoad(o) {
    this.setData({ knowledgeId: o.knowledgeId || "" });
  },
  onShow() {
    const g = getApp().game;
    this.setData({
      version: g ? g.contentVersion : C.VERSION,
      eventId: g ? g.eventId || "无" : "无",
      round: g ? g.round : 0,
    });
  },
  input(e) {
    this.setData({ text: e.detail.value });
  },
  save() {
    if (!this.data.text.trim()) return;
    const app = getApp(),
      entry = {
        text: this.data.text.trim(),
        version: this.data.version,
        eventId: this.data.eventId,
        round: this.data.round,
        knowledgeId: this.data.knowledgeId,
        at: Date.now(),
      };
    try {
      app.storage.write("feedback", app.storage.list("feedback").concat(entry));
      this.setData({ saved: true });
    } catch (_) {
      wx.showToast({ title: "本地保存失败，请复制反馈。", icon: "none" });
    }
  },
  copy() {
    wx.setClipboardData({
      data:
        "高性价比人生问题反馈\n内容版本：" +
        this.data.version +
        "\n事件：" +
        this.data.eventId +
        "\n回合：" +
        this.data.round +
        "\n知识条目：" +
        (this.data.knowledgeId || "无") +
        "\n说明：" +
        this.data.text,
      fail() {
        wx.showToast({ title: "复制失败，请重试。", icon: "none" });
      },
    });
  },
});
