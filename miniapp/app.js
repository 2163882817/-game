const Engine = require("./engine/game");
const { createStorage } = require("./services/storage");
App({
  onLaunch() {
    this.storage = createStorage(wx);
    this.game = this.storage.load();
    this.pending = null;
    this.storageDamaged = !this.game && this.storage.hasStored();
  },
  start() {
    if (this.pending) throw new Error("请先重试保存。");
    return this.commit(Engine.start(), true);
  },
  dispatch(type, payload) {
    if (this.pending) throw new Error("请先重试保存。");
    if (!this.game) throw new Error("请先开始一局人生。");
    const next = Engine.command(this.game, type, payload);
    if (next === this.game) return this.game;
    return this.commit(next);
  },
  commit(next, replace = false) {
    try {
      if (replace) this.storage.replace(next);
      else this.storage.save(next);
      this.game = next;
      if (next.phase === "ENDING") this.storage.archive(next);
      this.recordAchievements(next);
      this.pending = null;
      return next;
    } catch (error) {
      this.pending = { snapshot: next, replace };
      wx.reLaunch({ url: "/pages/save-error/index" });
      throw new Error("保存未完成，请重试。");
    }
  },
  recordAchievements(g) {
    // 成就属于独立资料，写入失败不能把已保存的回合再次结算。
    try {
      const ids = this.storage.list("achievements");
      if (g.history.length) ids.push("first");
      if (g.stageReports.length) ids.push("stage");
      if (g.assets.length) ids.push("asset");
      if (g.upgraded) ids.push("upgrade");
      if (g.phase === "ENDING") ids.push("finish");
      if (this.storage.list("history").length >= 2) ids.push("replay");
      this.storage.write("achievements", Array.from(new Set(ids)));
    } catch (_) {}
  },
  retry() {
    if (this.pending) {
      const p = this.pending;
      return this.commit(p.snapshot, p.replace);
    }
    return this.game;
  },
  resumeUrl() {
    if (this.pending) return "/pages/save-error/index";
    if (!this.game) return "/pages/home/index";
    const route = {
      READY: "board",
      MOVING: "board",
      CHOOSING: "event",
      ASSET_OFFER: "event",
      PROTECTION: "event",
      RECOVERY: "recovery",
      RESULT: "result",
      STAGE_REPORT: "stage-report",
      ENDING: "ending",
    }[this.game.phase];
    return "/pages/" + (route || "home") + "/index";
  },
});
