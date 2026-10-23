const C = require("../../content/index");
const U = require("../../utils/page");
Page({
  data: {
    query: "",
    topic: "全部",
    topics: ["全部", "租房", "工作", "消费", "安全"],
    onlySaved: false,
    evidence: 0,
    evidenceOptions: ["全部证据等级", "待审核"],
    items: [],
  },
  onShow() {
    this.filter();
  },
  input(e) {
    this.setData({ query: e.detail.value });
    this.filter();
  },
  topic(e) {
    this.setData({ topic: e.currentTarget.dataset.topic });
    this.filter();
  },
  saved() {
    this.setData({ onlySaved: !this.data.onlySaved });
    this.filter();
  },
  evidence(e) {
    this.setData({ evidence: Number(e.detail.value) });
    this.filter();
  },
  filter() {
    const favorites = getApp().storage.list("favorites");
    const q = this.data.query.trim().toLowerCase();
    this.setData({
      items: C.knowledge
        .filter(
          (k) =>
            (this.data.topic === "全部" || k.topic === this.data.topic) &&
            (!this.data.onlySaved || favorites.includes(k.id)) &&
            (!q || (k.title + k.summary + k.topic).toLowerCase().includes(q)) &&
            (!this.data.evidence || k.evidence === "待审核"),
        )
        .map((k) => ({ ...k, saved: favorites.includes(k.id) })),
    });
  },
  detail(e) {
    wx.navigateTo({
      url: "/pages/guide-detail/index?id=" + e.currentTarget.dataset.id,
    });
  },
  clear() {
    this.setData({ query: "", topic: "全部", onlySaved: false, evidence: 0 });
    this.filter();
  },
  nav: U.nav,
});
