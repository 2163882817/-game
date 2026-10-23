const U = require("../../utils/page");
const C = require("../../content/index");
Page({
  onShow() {
    if (!U.requireGame(this, ["STAGE_REPORT"])) return;
    const g = this.data.game,
      r = g.stageReports[g.stageReports.length - 1];
    this.setData({
      report: r,
      nextStage: C.stages[g.stage],
      headline: [
        "在这座城，先安顿下来",
        "把生活，慢慢理顺",
        "变化之中，仍然有路",
        "走到这里，也看见了自己",
      ][g.stage - 1],
      choices: r.choices.slice(-4),
      carry: g.flags.length
        ? "你为下一段生活积累了 " + g.flags.length + " 条经历。"
        : "保持探索，下一段路还有新的可能。",
    });
  },
  next() {
    if (U.run(this, "NEXT_STAGE")) U.resume();
  },
});
