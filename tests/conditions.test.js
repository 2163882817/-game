const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const C = require("../miniapp/content");
const E = require("../miniapp/engine/game");
const { validatePreconditions, matchesPreconditions } = require("../miniapp/engine/conditions");
const { validateContent } = require("../scripts/validate-content");
const copy = () => JSON.parse(JSON.stringify(C));

test("未配置条件兼容旧事件，全部条件使用且关系", () => {
  const g = E.start(3);
  assert.equal(matchesPreconditions(g), true);
  assert.equal(matchesPreconditions(g, {}), true);
  const condition = { allFlags: ["contract", "records"], noneFlags: ["deposit"] };
  g.flags = ["contract"];
  assert.equal(matchesPreconditions(g, condition), false);
  g.flags.push("records");
  assert.equal(matchesPreconditions(g, condition), true);
  g.flags.push("deposit");
  assert.equal(matchesPreconditions(g, condition), false);
});

test("资源上下界包含边界，并与选择标记组合判断", () => {
  const g = E.start(3);
  const condition = { allFlags: ["contract"], resources: { cash: { min: 6000, max: 6000 }, energy: { min: 80 } } };
  g.flags = ["contract"];
  assert.equal(matchesPreconditions(g, condition), true);
  for (const cash of [5999, 6001]) {
    g.resources.cash = cash;
    assert.equal(matchesPreconditions(g, condition), false);
  }
  g.resources.cash = 6000;
  g.resources.energy = 79;
  assert.equal(matchesPreconditions(g, condition), false);
});

test("白名单拒绝脚本、未知字段、错误类型、矛盾与不可能范围", () => {
  for (const condition of [
    null, "return true", [], { script: "throw new Error()" },
    { allFlags: "contract" }, { noneFlags: [""] }, { allFlags: ["x", "x"] },
    { allFlags: ["x"], noneFlags: ["x"] }, { resources: [] },
    { resources: { money: { min: 1 } } }, { resources: { cash: {} } },
    { resources: { cash: { min: 10, max: 9 } } },
    { resources: { energy: { max: 101 } } }, { resources: { health: { min: -1 } } },
    { resources: { cash: { min: Infinity } } }, { resources: { cash: { equals: 1 } } },
  ]) {
    assert.ok(validatePreconditions(condition).length > 0);
    assert.equal(matchesPreconditions(E.start(3), condition), false);
  }
});

test("条件筛选在未见优先之前执行，不匹配时使用同阶段保底", () => {
  const c = copy();
  const g = E.start(3);
  for (const event of c.events) event.preconditions = { allFlags: ["contract"] };
  assert.equal(E.eventCandidates(g, c)[0].id, c.fallbackMap[1].event);
  g.flags.push("contract");
  assert.ok(E.eventCandidates(g, c).every((event) => event.stage === 1 && c.events.includes(event)));
  g.history = [{ eventId: "e1" }];
  c.events[0].preconditions = { allFlags: ["missing"] };
  assert.deepEqual(E.eventCandidates(g, c).map((event) => event.id), ["e1"]);
});

test("内容校验报告条件错误，主线和保底不得引入触发门槛", () => {
  const c = copy();
  c.events[0].preconditions = { resources: { cash: { min: 10, max: 1 } } };
  c.mains[0].preconditions = { allFlags: ["contract"] };
  c.fallbackEvents[0].preconditions = { resources: { cash: { min: 1 } } };
  const errors = validateContent(c).errors;
  assert.ok(errors.some((error) => error.includes("事件 e0") && error.includes("min 不能大于 max")));
  for (const id of ["main0", "fallback0"])
    assert.ok(errors.some((error) => error.includes(`事件 ${id}`) && error.includes("不允许设置触发门槛")));
});

test("条件求值不改变快照、内容或随机抽取序号", () => {
  const c = copy();
  c.events[0].preconditions = { noneFlags: ["deposit"], resources: { cash: { min: 0 } } };
  const g = E.start(3);
  const before = JSON.stringify({ c, g });
  E.eventCandidates(g, c);
  assert.equal(JSON.stringify({ c, g }), before);
  const restored = JSON.parse(JSON.stringify(g));
  assert.deepEqual(E.eventCandidates(restored, c), E.eventCandidates(g, c));
});

test("条件事件承诺后，退出恢复继续读取同一事件而不重新筛选", () => {
  const c = copy();
  c.events = [c.events[0]];
  c.events[0].preconditions = { allFlags: ["contract"], resources: { cash: { min: 6000 } } };
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../miniapp/engine/game.js"), "utf8"), {
    module,
    require(id) {
      if (id === "../content/index") return c;
      assert.equal(id, "./conditions");
      return require("../miniapp/engine/conditions");
    },
  });
  const engine = module.exports;
  const g = engine.start(123);
  g.flags.push("contract");
  const committed = engine.command(g, "ROLL");
  assert.equal(committed.eventId, "e0");
  const restored = JSON.parse(JSON.stringify(committed));
  assert.equal(engine.command(restored, "ROLL"), restored);
  assert.equal(engine.event(restored).id, "e0");
  // 资源发生变化也不重抽已承诺事件；选项资格仍由结算时资源决定。
  restored.resources.cash = 0;
  assert.equal(engine.event(restored).id, "e0");
  assert.ok(engine.event(restored).options.some((o) => engine.eligible(restored, o)));
});
