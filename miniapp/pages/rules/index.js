const C = require("../../content/index");
Page({
  data: {
    tab: 0,
    tabs: ["玩法", "棋盘与阶段", "数值", "存档与说明"],
    board: C.board,
    stages: C.stages,
  },
  onLoad(o) {
    this.setData({ tab: Number(o.tab) || 0 });
  },
  tab(e) {
    this.setData({ tab: Number(e.currentTarget.dataset.id) });
  },
});
