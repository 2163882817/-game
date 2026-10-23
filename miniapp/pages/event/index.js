const U = require("../../utils/page");
const E = require("../../engine/game");
Page({
  data: { selected: "", busy: false },
  onShow() {
    if (!U.requireGame(this, ["CHOOSING", "ASSET_OFFER", "PROTECTION"])) return;
    const g = getApp().game;
    if (g.phase === "CHOOSING") {
      const event = E.event(g);
      this.setData({
        event,
        options: event.options.map((o, i) => {
          const availability = E.optionAvailability(g, o);
          return {
            ...o,
            letter: String.fromCharCode(65 + i),
            disabled: !availability.allowed,
            disabledReason: availability.reason,
          };
        }),
      });
    }
  },
  select(e) {
    this.setData({ selected: e.currentTarget.dataset.id });
  },
  confirm() {
    if (this.data.busy || !this.data.selected) return;
    this.setData({ busy: true });
    if (U.run(this, "CHOOSE", { id: this.data.selected })) U.resume();
    else this.setData({ busy: false });
  },
  buy() {
    if (U.run(this, "BUY", { buy: true })) U.resume();
  },
  skip() {
    if (U.run(this, "BUY", { buy: false })) U.resume();
  },
  protect() {
    if (U.run(this, "PROTECT", { buy: true })) U.resume();
  },
  skipProtect() {
    if (U.run(this, "PROTECT", { buy: false })) U.resume();
  },
});
