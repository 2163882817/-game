const test = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");
const C = require("../miniapp/content/index");
const { validateContent } = require("../scripts/validate-content");
const copy = () => JSON.parse(JSON.stringify(C));

test("演示包允许开发校验，但正式发布基础门禁必须阻断", () => {
  assert.deepEqual(validateContent(C).errors, []);
  const result = validateContent(C, { release: true });
  assert.equal(result.counts.events, 16);
  for (const phrase of ["demo/test/draft", "60 个事件", "40 条知识", "配置化结局", "证据等级未审核", "尚未锁定来源"])
    assert.ok(result.errors.some((e) => e.includes(phrase)), phrase);
});

test("跨普通事件和主线的 ID 冲突、同一事件的选项冲突均被发现", () => {
  const c = copy();
  c.mains[0].id = c.events[0].id;
  c.events[0].options[1].id = c.events[0].options[0].id;
  const errors = validateContent(c).errors;
  assert.ok(errors.some((e) => e.includes("事件（含阶段主线） 存在重复 ID")));
  assert.ok(errors.some((e) => e.includes("选项 存在重复 ID")));
});

test("无效引用、缺少结果、选项数量和非法数值都有具体报错", () => {
  const c = copy();
  c.events[0].knowledgeId = "missing";
  c.events[0].stage = 9;
  c.events[0].options = [c.events[0].options[0]];
  c.events[0].options[0].result = "";
  c.events[0].options[0].effects = { unknown: 1, cash: Infinity };
  const errors = validateContent(c).errors;
  for (const phrase of ["不存在的知识", "无效阶段", "2—4 个选项", "缺少 result", "未知资源", "有限数值"])
    assert.ok(errors.some((e) => e.includes(phrase)), phrase);
});

test("损坏数据返回诊断，不因空条目崩溃", () => {
  const c = copy();
  c.events.push(null);
  c.events[0].options = null;
  assert.ok(validateContent(c).errors.length > 0);
  assert.ok(validateContent(null).errors.length > 0);
});

test("发布命令失败使用非零退出码，错误参数不能绕过门禁", () => {
  const script = path.join(__dirname, "../scripts/validate-content.js");
  for (const arg of ["--release", "--relase"]) {
    const result = spawnSync(process.execPath, [script, arg], { encoding: "utf8" });
    assert.equal(result.status, 1);
    assert.ok(result.stderr.length > 0);
  }
});

test("每个阶段都必须有普通事件，避免掷骰时抽取空事件池", () => {
  const c = copy();
  c.events = c.events.filter((e) => e.stage !== 3);
  assert.ok(validateContent(c).errors.some((e) => e.includes("阶段 3") && e.includes("缺少普通事件")));
});

test("阶段主线缺失、重复或 ID 不匹配当前引擎时阻断", () => {
  const missing = copy();
  missing.mains.pop();
  assert.ok(validateContent(missing).errors.some((e) => e.includes("阶段 4") && e.includes("当前 0")));
  const duplicate = copy();
  duplicate.mains.push({ ...duplicate.mains[0], id: "extra-main" });
  assert.ok(validateContent(duplicate).errors.some((e) => e.includes("阶段 1") && e.includes("当前 2")));
  const renamed = copy();
  renamed.mains[1].id = "other-main";
  assert.ok(validateContent(renamed).errors.some((e) => e.includes("主线 ID 必须为 main1")));
});

test("阶段数量、空名称和重复名称不能通过开发校验", () => {
  for (const stages of [[], ["一", "二", "三"], ["一", " ", "三", "四"], ["一", " 一 ", "三", "四"]]) {
    const c = copy();
    c.stages = stages;
    assert.ok(validateContent(c).errors.some((e) => /4 个阶段|缺少名称|阶段名称重复/.test(e)));
  }
});

test("零现金检查使用实际效果，而不是选项费用文案", () => {
  const c = copy();
  for (const option of c.events[0].options) {
    option.cost = "费用 ¥0";
    option.effects.cash = -1;
  }
  assert.ok(validateContent(c).errors.some((e) => e.includes("事件 e0 缺少零现金可选项")));
  c.events[0].options[0].effects = { energy: -100 };
  assert.ok(!validateContent(c).errors.some((e) => e.includes("事件 e0 缺少零现金可选项")));
});

test("非法效果与超过资源上限的成本不能充当零现金路径", () => {
  for (const effects of [{ energy: -101 }, { energy: NaN }, { unknown: 0 }, null, []]) {
    const c = copy();
    for (const option of c.mains[0].options) option.effects = effects;
    assert.ok(validateContent(c).errors.some((e) => e.includes("事件 main0 缺少零现金可选项")));
  }
});
