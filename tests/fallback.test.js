const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const C = require("../miniapp/content");
const E = require("../miniapp/engine/game");
const { validateContent } = require("../scripts/validate-content");
const copy = () => JSON.parse(JSON.stringify(C));

test("四阶段空池或全部普通选项不可执行时使用同阶段保底", () => {
  for (let stage = 1; stage <= 4; stage++) {
    const c = copy();
    const g = E.start(7);
    g.stage = stage;
    g.resources = { cash: 0, energy: 0, health: 0, protection: 0 };
    for (const e of c.events) for (const o of e.options) o.effects = { cash: -1 };
    assert.equal(E.eventCandidates(g, c)[0].id, c.fallbackMap[stage].event);
    c.events = [];
    const fallback = E.eventCandidates(g, c)[0];
    assert.equal(fallback.stage, stage);
    assert.ok(fallback.options.some((o) => E.eligible(g, o)));
  }
});

test("普通事件可执行时优先未见事件，全部见过仍保持原有复用规则", () => {
  const g = E.start(7);
  const pool = E.eventCandidates(g);
  assert.ok(pool.every((e) => C.events.includes(e)));
  g.history = [{ eventId: pool[0].id }];
  assert.ok(!E.eventCandidates(g).some((e) => e.id === pool[0].id));
  g.history = pool.map((e) => ({ eventId: e.id }));
  assert.deepEqual(E.eventCandidates(g), pool);
});

test("保底事件随掷骰承诺，快照恢复后可读取和结算且不会重掷", () => {
  const c = copy();
  c.events = [];
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../miniapp/engine/game.js"), "utf8"), {
    module,
    require(id) {
      assert.equal(id, "../content/index");
      return c;
    },
  });
  const engine = module.exports;
  const g = engine.start(123);
  const dice = E.command(E.start(123), "ROLL").roll.dice;
  g.position = (2 - dice + 16) % 16;
  const committed = engine.command(g, "ROLL");
  assert.equal(committed.eventId, c.fallbackMap[1].event);
  const restored = JSON.parse(JSON.stringify(committed));
  assert.equal(engine.command(restored, "ROLL"), restored);
  const landed = engine.command(restored, "LAND");
  assert.equal(landed.phase, "CHOOSING");
  const event = engine.event(landed);
  assert.equal(event.id, committed.eventId);
  const settled = engine.command(landed, "CHOOSE", { id: event.options[0].id });
  assert.equal(settled.phase, "RESULT");
  assert.equal(settled.history.at(-1).eventId, event.id);
  assert.equal(engine.command(settled, "CHOOSE", { id: event.options[0].id }), settled);
});

test("缺少映射、跨阶段引用、重复 ID 和非免费保底不能通过校验", () => {
  const missing = copy();
  delete missing.fallbackMap[2];
  assert.ok(validateContent(missing).errors.some((e) => e.includes("阶段 2 机会格保底事件不存在")));
  const crossStage = copy();
  crossStage.fallbackMap[1].event = crossStage.fallbackMap[2].event;
  assert.ok(validateContent(crossStage).errors.some((e) => e.includes("不能引用其他阶段")));
  const duplicate = copy();
  duplicate.fallbackEvents[0].id = duplicate.events[0].id;
  assert.ok(validateContent(duplicate).errors.some((e) => e.includes("重复 ID")));
  const paid = copy();
  for (const o of paid.fallbackEvents[0].options) o.effects = { energy: -1 };
  assert.ok(validateContent(paid).errors.some((e) => e.includes("所有资源均为 0")));
});

test("保底配置失效时明确报错，不修改原快照或抽取其他阶段", () => {
  const c = copy();
  c.events = [];
  c.fallbackMap = {};
  const g = E.start(7);
  const before = JSON.stringify(g);
  assert.throws(() => E.eventCandidates(g, c), /缺少可执行的保底事件/);
  assert.equal(JSON.stringify(g), before);
});
