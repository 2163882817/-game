Component({
  properties: { title: String, home: { type: Boolean, value: false } },
  data: { top: 24, height: 44, right: 96 },
  lifetimes: {
    attached() {
      this.updateMetrics();
    },
  },
  pageLifetimes: {
    resize() {
      this.updateMetrics();
    },
  },
  methods: {
    updateMetrics() {
      try {
        const info = wx.getWindowInfo
          ? wx.getWindowInfo()
          : wx.getSystemInfoSync();
        const capsule = wx.getMenuButtonBoundingClientRect();
        const top = info.statusBarHeight || 0;
        const validCapsule = capsule && capsule.height > 0 && capsule.top >= top;
        this.setData({
          top,
          height: validCapsule ? (capsule.top - top) * 2 + capsule.height : 44,
          right: validCapsule ? Math.max(0, info.windowWidth - capsule.left + 10) : 96,
        });
      } catch (_) {}
    },
    back() {
      if (this.data.home) return;
      const stack = getCurrentPages();
      if (stack.length > 1) wx.navigateBack();
      else wx.reLaunch({ url: "/pages/home/index" });
    },
  },
});
