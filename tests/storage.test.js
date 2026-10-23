const test = require("node:test");
const assert = require("node:assert/strict");
const { createStorage } = require("../miniapp/services/storage");
const E = require("../miniapp/engine/game");
function fixture() {
  const map = new Map();
  let fail = false;
  return {
    map,
    api: {
      getStorageSync: (k) => map.get(k),
      setStorageSync(k, v) {
        if (fail) throw new Error("disk full");
        map.set(k, JSON.parse(JSON.stringify(v)));
      },
    },
    fail() {
      fail = true;
    },
  };
}
test("双槽存档损坏时回退上一有效快照", () => {
  const f = fixture(),
    s = createStorage(f.api),
    g = E.start(1);
  s.save(g);
  const n = E.command(g, "ROLL");
  s.save(n);
  assert.equal(s.load().phase, "MOVING");
  f.map.get("better-life:v1:b").checksum = "bad";
  assert.equal(s.load().phase, "READY");
});
test("重开使用更大revision，重新启动不会错误恢复旧局", () => {
  const f = fixture(),
    s = createStorage(f.api);
  const old = E.start(1);
  old.revision = 80;
  s.save(old);
  const n = E.start(2);
  s.replace(n);
  assert.equal(s.load().gameId, n.gameId);
  assert.equal(s.load().revision, 81);
});
test("写入失败仍保留此前快照；历史与收藏不会被重开清理", () => {
  const f = fixture(),
    s = createStorage(f.api);
  const g = E.start(1);
  s.save(g);
  s.archive(g);
  s.archive(g);
  s.write("favorites", ["k0"]);
  s.replace(E.start(2));
  assert.equal(s.list("history").length, 1);
  assert.deepEqual(s.list("favorites"), ["k0"]);
  f.fail();
  assert.throws(() => s.save(E.command(s.load(), "ROLL")));
  assert.equal(s.load().phase, "READY");
});
