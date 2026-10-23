const test = require("node:test");
const assert = require("node:assert/strict");
const E = require("../miniapp/engine/game");
const C = require("../miniapp/content");
function landAt(position, from = position - 1) {
  const g = E.start(42);
  g.position = (from + 16) % 16;
  g.phase = "MOVING";
  g.roll = { dice: 1, path: [position], from: g.position, changes: [] };
  g.eventId = "e0";
  return E.command(g, "LAND");
}
test("统一初值和确定性随机，承诺骰值后不能重掷", () => {
  const g = E.start(123);
  assert.deepEqual(g.resources, {
    cash: 6000,
    energy: 80,
    health: 80,
    protection: 50,
  });
  const a = E.command(g, "ROLL"),
    b = E.command(g, "ROLL");
  assert.deepEqual(a.roll, b.roll);
  assert.equal(E.command(a, "ROLL"), a);
  assert.equal(g.phase, "READY");
  assert.ok(a.roll.dice >= 1 && a.roll.dice <= 6);
  assert.equal(a.roll.path.length, a.roll.dice);
});
test("跨起点及恰好落起点，只发一次工资与收益", () => {
  for (const path of [[15, 0, 1], [0]]) {
    const g = E.start(2);
    g.phase = "MOVING";
    g.position = 14;
    g.roll = { dice: path.length, path, changes: [] };
    g.assets = [{ tileId: 3, level: 2 }];
    const next = E.command(g, "LAND");
    assert.equal(next.resources.cash, 8650);
    assert.equal(next.totalIncome, 650);
    assert.equal(E.command(next, "LAND"), next);
  }
});
test("固定格截断上限，并展示真实变化", () => {
  const g = E.start();
  g.phase = "MOVING";
  g.resources.energy = 98;
  g.roll = { path: [4], changes: [] };
  const n = E.command(g, "LAND");
  assert.equal(n.resources.energy, 100);
  assert.equal(n.result.changes[0].delta, 2);
  assert.equal(n.result.changes[0].capped, true);
});
test("购买不会重复扣款；资产收益及升级资格", () => {
  const offer = landAt(1),
    n = E.command(offer, "BUY", { buy: true });
  assert.equal(n.resources.cash, 3000);
  assert.equal(n.assets.length, 1);
  assert.equal(E.command(n, "BUY", { buy: true }), n);
  const upgraded = E.command(n, "UPGRADE", { id: 1 });
  assert.equal(upgraded.resources.cash, 1800);
  assert.equal(upgraded.assets[0].level, 2);
  assert.throws(() => E.command(upgraded, "UPGRADE", { id: 1 }));
  const sold = E.command(upgraded, "SELL", { id: 1 });
  assert.equal(sold.assets.length, 0);
  assert.equal(sold.resources.cash, 3300);
  assert.equal(E.command(sold, "SELL", { id: 1 }), sold);
});
test("资源不足时保留选项；确认后不重复结算", () => {
  let g = landAt(2);
  g.resources.cash = 0;
  g.resources.energy = 5;
  const event = E.event(g);
  assert.equal(E.eligible(g, event.options[0]), false);
  g.resources.energy = 80;
  assert.ok(event.options.some((o) => E.eligible(g, o)));
  const n = E.command(g, "CHOOSE", { id: "c" });
  assert.equal(n.resources.energy, 68);
  assert.equal(E.command(n, "CHOOSE", { id: "c" }), n);
  assert.equal(n.history.length, 1);
});
test("无法支付的费用可以减免；援助每局一次；不能负现金", () => {
  let g = E.start();
  g.resources.cash = 0;
  g.phase = "MOVING";
  g.roll = { path: [12], changes: [] };
  g = E.command(g, "LAND");
  assert.equal(g.phase, "RECOVERY");
  let n = E.command(g, "RECOVER", { method: "waive" });
  assert.equal(n.resources.cash, 0);
  assert.match(n.result.text, /300/);
  n = E.command(g, "RECOVER", { method: "aid" });
  assert.equal(n.resources.cash, 700);
  assert.equal(n.aidUsed, true);
  n.phase = "RECOVERY";
  n.debt = 300;
  assert.throws(() => E.command(n, "RECOVER", { method: "aid" }));
});
test("低资源下回合休整，恢复不会超出上限", () => {
  const g = E.start(25);
  g.resources.energy = 0;
  g.resources.health = 20;
  const n = E.command(g, "ROLL");
  assert.equal(n.resources.energy, 20);
  assert.equal(n.resources.health, 40);
});
test("100 个种子完成24回合、4段主线、4份报告与结局，无死路", () => {
  for (let seed = 1; seed <= 100; seed++) {
    let g = E.start(seed),
      steps = 0;
    while (g.phase !== "ENDING" && steps++ < 250) {
      switch (g.phase) {
        case "READY":
          g = E.command(g, "ROLL");
          break;
        case "MOVING":
          g = E.command(g, "LAND");
          break;
        case "CHOOSING": {
          const options = E.event(g).options.filter((o) => E.eligible(g, o));
          assert.ok(options.length);
          g = E.command(g, "CHOOSE", { id: options[0].id });
          break;
        }
        case "ASSET_OFFER":
          g = E.command(g, "BUY", { buy: g.resources.cash >= 4000 });
          break;
        case "PROTECTION":
          g = E.command(g, "PROTECT", { buy: g.resources.cash >= 200 });
          break;
        case "RECOVERY":
          g = E.command(g, "RECOVER", { method: g.aidUsed ? "waive" : "aid" });
          break;
        case "RESULT":
          g = E.command(g, "NEXT");
          break;
        case "STAGE_REPORT":
          g = E.command(g, "NEXT_STAGE");
          break;
        default:
          assert.fail(g.phase);
      }
      assert.ok(g.resources.cash >= 0);
      for (const k of ["energy", "health", "protection"])
        assert.ok(g.resources[k] >= 0 && g.resources[k] <= 100);
    }
    assert.equal(g.phase, "ENDING");
    assert.equal(g.round, 24);
    assert.equal(g.stageReports.length, 4);
    assert.equal(g.history.filter((h) => h.main).length, 4);
  }
});
test("四种结局均有可解释的条件", () => {
  const g = E.start();
  assert.equal(E.ending(g).id, "balance");
  g.resources.energy = 30;
  g.resources.protection = 80;
  assert.equal(E.ending(g).id, "secure");
  g.resources.protection = 50;
  g.assets = [{}, {}];
  assert.equal(E.ending(g).id, "builder");
  g.assets = [];
  assert.equal(E.ending(g).id, "explorer");
});
test("演示内容引用完整，事件至少保留一个低现金可选方案", () => {
  assert.equal(C.board.length, 16);
  assert.equal(C.board.filter((t) => t.type === "asset").length, 4);
  for (const e of C.events.concat(C.mains)) {
    assert.ok(C.knowledge.some((k) => k.id === e.knowledgeId));
    assert.ok(e.options.length >= 2 && e.options.length <= 4);
    const g = E.start();
    g.resources.cash = 0;
    assert.ok(e.options.some((o) => E.eligible(g, o)));
  }
});
