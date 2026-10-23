const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { createRequire } = require("node:module");

function setup(map = new Map()) {
  let app;
  let page;
  let failKey = "";
  const toasts = [];
  const wx = {
    getStorageSync: (key) => map.get(key),
    setStorageSync(key, value) {
      if (key.endsWith(failKey) && failKey) throw new Error("full");
      map.set(key, JSON.parse(JSON.stringify(value)));
    },
    reLaunch() {},
    showToast(value) { toasts.push(value.title); },
  };
  const appFile = path.resolve(__dirname, "../miniapp/app.js");
  vm.runInNewContext(fs.readFileSync(appFile, "utf8"), {
    App(value) { app = value; }, wx, require: createRequire(appFile),
  });
  app.onLaunch();
  const pageFile = path.resolve(__dirname, "../miniapp/pages/new-game/index.js");
  vm.runInNewContext(fs.readFileSync(pageFile, "utf8"), {
    Page(value) { page = value; }, getApp: () => app, wx, require: createRequire(pageFile),
  });
  page.data = { ...page.data };
  page.setData = (value) => Object.assign(page.data, value);
  return { app, page, map, toasts, fail(key) { failKey = key; } };
}

test("首次进入显示三步说明，未开局退出不标记完成", () => {
  const f = setup();
  f.page.onShow();
  assert.equal(f.page.data.showGuide, true);
  assert.deepEqual(f.app.storage.list("onboarding"), []);
  assert.equal(setup(f.map).page.data.showGuide, true);
});

test("开局保存成功后重进默认收起，主动查看或收起不改变对局", () => {
  const f = setup();
  f.page.onShow();
  f.page.start();
  assert.ok(f.app.storage.list("onboarding").includes("v1"));
  const reopened = setup(f.map);
  reopened.page.onShow();
  assert.equal(reopened.page.data.showGuide, false);
  const before = JSON.stringify(reopened.app.game);
  reopened.page.toggleGuide();
  assert.equal(reopened.page.data.showGuide, true);
  reopened.page.toggleGuide();
  assert.equal(reopened.page.data.showGuide, false);
  assert.equal(JSON.stringify(reopened.app.game), before);
});

test("新局保存失败不记录完成，同一快照重试成功后才记录", () => {
  const f = setup();
  f.fail(":b");
  f.page.start();
  assert.ok(f.app.pending);
  assert.ok(!f.app.storage.list("onboarding").includes("v1"));
  f.fail("");
  f.app.retry();
  assert.ok(f.app.storage.list("onboarding").includes("v1"));
  assert.equal(f.app.pending, null);
});

test("引导偏好写入失败不阻断已成功的新局，并提示下次仍显示", () => {
  const f = setup();
  f.fail(":onboarding");
  f.page.start();
  assert.ok(f.app.game);
  assert.equal(f.app.pending, null);
  assert.ok(f.toasts.some((title) => title.includes("引导记录未保存")));
  const reopened = setup(f.map);
  reopened.page.onShow();
  assert.equal(reopened.page.data.showGuide, true);
  assert.equal(reopened.app.game.gameId, f.app.game.gameId);
});

test("引导偏好独立保存，不覆盖历史、收藏或成就", () => {
  const f = setup();
  f.app.storage.write("favorites", ["k0"]);
  f.app.storage.write("history", [{ gameId: "old" }]);
  f.app.storage.write("achievements", ["learn"]);
  f.page.start();
  assert.deepEqual(f.app.storage.list("favorites"), ["k0"]);
  assert.deepEqual(f.app.storage.list("history"), [{ gameId: "old" }]);
  assert.ok(f.app.storage.list("achievements").includes("learn"));
});
