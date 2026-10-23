const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const E = require("../miniapp/engine/game");

test("选项列出每一种不足资源及准确差额", () => {
  const g = E.start(1);
  g.resources = { cash: 100, energy: 2, health: 3, protection: 4 };
  const result = E.optionAvailability(g, { effects: { cash: -260, energy: -8, health: -5, protection: -10 } });
  assert.equal(result.allowed, false);
  assert.deepEqual(result.shortages.map((item) => item.missing), [160, 6, 2, 6]);
  assert.equal(result.reason, "现金还差 ¥160；精力还差 6 点；健康还差 2 点；保障还差 6 点");
});

test("资源刚好够用、无变化和正收益不禁用、不显示不足提示", () => {
  const g = E.start(1);
  for (const effects of [{ cash: -6000, energy: -80 }, {}, { cash: 100, health: 5, protection: 0 }]) {
    const option = { effects };
    assert.deepEqual(E.optionAvailability(g, option), { allowed: true, shortages: [], reason: "" });
    assert.equal(E.eligible(g, option), true);
  }
});

test("现金差额带千位分隔，收益不能抵消另一资源的不足", () => {
  const g = E.start(1);
  g.resources.cash = 0;
  const result = E.optionAvailability(g, { effects: { cash: -3000, energy: 80 } });
  assert.equal(result.reason, "现金还差 ¥3,000");
  assert.equal(result.shortages.length, 1);
});

test("确认时按最新资源重新校验，拒绝提交且原存档不变", () => {
  const g = E.start(1);
  g.phase = "CHOOSING";
  g.eventId = "e0";
  g.roll = { changes: [] };
  const option = E.event(g).options[0];
  assert.equal(E.optionAvailability(g, option).allowed, true);
  g.resources.cash = 100;
  g.resources.energy = 2;
  const before = JSON.stringify(g);
  assert.throws(() => E.command(g, "CHOOSE", { id: option.id }), /现金还差 ¥160；精力还差 6 点/);
  assert.equal(JSON.stringify(g), before);
});

test("不把不存在的选项误报为资源不足", () => {
  const g = E.start(1);
  g.phase = "CHOOSING";
  g.eventId = "e0";
  assert.throws(() => E.command(g, "CHOOSE", { id: "missing" }), /该选项已不可用/);
});

test("损坏或未知资源配置不可被视为可执行选项", () => {
  const g = E.start(1);
  for (const effects of [null, [], { cash: NaN }, { unknown: -1 }, { energy: "-8" }]) {
    const result = E.optionAvailability(g, { effects });
    assert.equal(result.allowed, false);
    assert.equal(result.reason, "选项配置不可用");
  }
});

test("事件页展示引擎计算的禁用原因，资源改变后重新进入会更新", () => {
  const g = E.start(1);
  g.phase = "CHOOSING";
  g.eventId = "e0";
  g.resources.cash = 100;
  g.resources.energy = 2;
  let page;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../miniapp/pages/event/index.js"), "utf8"), {
    Page(value) { page = value; },
    getApp: () => ({ game: g }),
    require(id) {
      if (id === "../../engine/game") return E;
      assert.equal(id, "../../utils/page");
      return { requireGame: () => true };
    },
  });
  page.data = { ...page.data };
  page.setData = (value) => Object.assign(page.data, value);
  page.onShow();
  assert.equal(page.data.options[0].disabled, true);
  assert.equal(page.data.options[0].disabledReason, "现金还差 ¥160；精力还差 6 点");
  g.resources.cash = 260;
  g.resources.energy = 8;
  page.onShow();
  assert.equal(page.data.options[0].disabled, false);
  assert.equal(page.data.options[0].disabledReason, "");
});
