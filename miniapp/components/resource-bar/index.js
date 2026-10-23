Component({
  properties: {
    resources: {
      type: Object,
      value: { cash: 6000, energy: 80, health: 80, protection: 50 },
    },
  },
  observers: {
    "resources.cash"(n) {
      this.setData({ cash: Number(n || 0).toLocaleString("en-US") });
    },
  },
  data: { cash: "6,000" },
  methods: {
    rules() {
      wx.navigateTo({ url: "/pages/rules/index?tab=2" });
    },
  },
});
