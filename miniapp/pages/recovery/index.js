const U = require("../../utils/page");
Page({
  onShow() {
    U.requireGame(this, ["RECOVERY"]);
  },
  nav: U.nav,
  aid() {
    if (U.run(this, "RECOVER", { method: "aid" })) U.resume();
  },
  waive() {
    if (U.run(this, "RECOVER", { method: "waive" })) U.resume();
  },
  pay() {
    if (U.run(this, "RECOVER", { method: "waive" })) U.resume();
  },
});
