const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const fs = require("node:fs");
const { createRequire } = require("node:module");
const path = require("node:path");
function boot(map = new Map()) {
  let app,
    fail = false,
    lastUrl = "";
  const file = path.resolve(__dirname, "../miniapp/app.js");
  const wx = {
    getStorageSync: (k) => map.get(k),
    setStorageSync(k, v) {
      if (fail) throw new Error("full");
      map.set(k, JSON.parse(JSON.stringify(v)));
    },
    reLaunch(o) {
      lastUrl = o.url;
    },
  };
  vm.runInNewContext(fs.readFileSync(file, "utf8"), {
    App(v) {
      app = v;
    },
    wx,
    require: createRequire(file),
  });
  app.onLaunch();
  return {
    app,
    map,
    fail(value) {
      fail = value;
    },
    url: () => lastUrl,
  };
}
test("应用写入失败阻断后续操作，重试保存同一骰值，重启恢复", () => {
  const f = boot();
  f.app.start();
  f.fail(true);
  assert.throws(() => f.app.dispatch("ROLL"));
  assert.equal(f.app.game.phase, "READY");
  assert.ok(f.app.pending);
  assert.equal(f.url(), "/pages/save-error/index");
  const dice = f.app.pending.snapshot.roll.dice;
  assert.throws(() => f.app.dispatch("ROLL"));
  f.fail(false);
  f.app.retry();
  assert.equal(f.app.game.roll.dice, dice);
  assert.equal(f.app.pending, null);
  const restarted = boot(f.map);
  assert.equal(restarted.app.game.roll.dice, dice);
  assert.equal(restarted.app.resumeUrl(), "/pages/board/index");
});
test("重开保存失败仍可恢复旧局，重试成功后采用新局", () => {
  const f = boot();
  f.app.start();
  f.app.dispatch("ROLL");
  const previous = f.app.game.gameId;
  f.fail(true);
  assert.throws(() =>
    f.app.commit(require("../miniapp/engine/game").start(555), true),
  );
  assert.equal(boot(f.map).app.game.gameId, previous);
  f.fail(false);
  f.app.retry();
  assert.equal(boot(f.map).app.game.gameId, "life-555");
});
