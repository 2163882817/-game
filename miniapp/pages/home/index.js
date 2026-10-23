const U = require("../../utils/page");
Page({
  data: { game: null, restart: false, recover: false, damaged: false },
  onShow() {
    const app = U.refresh(this);
    this.setData({ damaged: app.storageDamaged });
  },
  nav: U.nav,
  start() {
    if (this.data.game && this.data.game.phase !== "ENDING")
      this.setData({ restart: true });
    else U.nav("new-game");
  },
  continueGame() {
    if (getApp().pending) {
      U.resume();
      return;
    }
    this.setData({ recover: true });
  },
  confirmResume() {
    U.resume();
  },
  cancel() {
    this.setData({ restart: false, recover: false });
  },
  confirmRestart() {
    this.cancel();
    U.nav("new-game");
  },
});
