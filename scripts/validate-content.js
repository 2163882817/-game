const resources = new Set(["cash", "energy", "health", "protection"]);
const hasText = (value) => typeof value === "string" && value.trim().length > 0;
const { validatePreconditions } = require("../miniapp/engine/conditions");

// 基础结构、阶段与机会格保底检查，不替代全状态可达性、来源审核和版本兼容验收。
function validateContent(content, { release = false } = {}) {
  const errors = [];
  const list = (value, name) => {
    if (!Array.isArray(value)) {
      errors.push(`${name} 必须是数组`);
      return [];
    }
    return value;
  };
  if (!content || typeof content !== "object") {
    return { errors: ["内容包必须是对象"], counts: {} };
  }
  const events = list(content.events, "events");
  const mains = list(content.mains, "mains");
  const fallbackEvents = list(content.fallbackEvents, "fallbackEvents");
  const knowledge = list(content.knowledge, "knowledge");
  const achievements = list(content.achievements, "achievements");
  const stages = list(content.stages, "stages");
  if (!hasText(content.VERSION)) errors.push("VERSION 不能为空");
  if (stages.length !== 4) errors.push("内容必须配置 4 个阶段");
  const stageNames = new Set();
  stages.forEach((name, i) => {
    if (!hasText(name)) errors.push(`阶段 ${i + 1} 缺少名称`);
    else if (stageNames.has(name.trim())) errors.push(`阶段名称重复：${name}`);
    else stageNames.add(name.trim());
    const stage = i + 1;
    if (!events.some((event) => event && event.stage === stage))
      errors.push(`阶段 ${stage}（${name}）缺少普通事件，无法抽取落格内容`);
    const stageMains = mains.filter((event) => event && event.stage === stage);
    if (stageMains.length !== 1) {
      errors.push(`阶段 ${stage}（${name}）必须配置 1 个阶段主线，当前 ${stageMains.length}`);
    } else if (stageMains[0].id !== `main${i}`) {
      errors.push(`阶段 ${stage} 主线 ID 必须为 main${i}，以匹配当前引擎`);
    }
  });

  function ids(items, label) {
    const seen = new Set();
    items.forEach((item, i) => {
      if (!item || !hasText(item.id)) {
        errors.push(`${label}[${i}] 缺少有效 ID`);
      } else if (seen.has(item.id)) {
        errors.push(`${label} 存在重复 ID：${item.id}`);
      } else seen.add(item.id);
    });
    return seen;
  }
  const allEvents = events.concat(mains, fallbackEvents);
  ids(allEvents, "事件（含阶段主线）");
  const knowledgeIds = ids(knowledge, "知识");
  ids(achievements, "成就");
  const fallbackMap = content.fallbackMap;
  if (!fallbackMap || typeof fallbackMap !== "object" || Array.isArray(fallbackMap))
    errors.push("fallbackMap 必须是按阶段和格子类型配置的对象");
  stages.forEach((_, i) => {
    const stage = i + 1;
    const id = fallbackMap && fallbackMap[stage] && fallbackMap[stage].event;
    const fallback = fallbackEvents.find((e) => e && e.id === id);
    if (!fallback) {
      errors.push(`阶段 ${stage} 机会格保底事件不存在：${id}`);
      return;
    }
    if (fallback.stage !== stage) errors.push(`阶段 ${stage} 保底映射不能引用其他阶段事件：${id}`);
    const hasFreePath = Array.isArray(fallback.options) && fallback.options.some((o) =>
      o && o.effects && typeof o.effects === "object" && !Array.isArray(o.effects) &&
      Object.entries(o.effects).every(([key, value]) =>
        resources.has(key) && Number.isFinite(value) && value >= 0,
      ),
    );
    if (!hasFreePath) errors.push(`保底事件 ${id} 至少需要一个所有资源均为 0 时仍可执行的选项`);
  });
  allEvents.forEach((event, i) => {
    if (!event || typeof event !== "object") return;
    const label = `事件 ${event.id || i}`;
    for (const error of validatePreconditions(event.preconditions)) errors.push(`${label}：${error}`);
    if ((mains.includes(event) || fallbackEvents.includes(event)) && event.preconditions &&
        Object.keys(event.preconditions).length)
      errors.push(`${label} 主线或保底不允许设置触发门槛`);
    if (!hasText(event.title)) errors.push(`${label} 缺少标题`);
    if (!hasText(event.context)) errors.push(`${label} 缺少背景`);
    if (!Number.isInteger(event.stage) || event.stage < 1 || event.stage > stages.length)
      errors.push(`${label} 引用了无效阶段：${event.stage}`);
    if (!knowledgeIds.has(event.knowledgeId))
      errors.push(`${label} 引用了不存在的知识：${event.knowledgeId}`);
    const options = list(event.options, `${label} options`);
    if (options.length < 2 || options.length > 4)
      errors.push(`${label} 必须有 2—4 个选项`);
    ids(options, `${label} 选项`);
    options.forEach((option, j) => {
      if (!option || typeof option !== "object") return;
      const name = `${label} / 选项 ${option.id || j}`;
      for (const field of ["label", "cost", "result"])
        if (!hasText(option[field])) errors.push(`${name} 缺少 ${field}`);
      if (!option.effects || typeof option.effects !== "object" || Array.isArray(option.effects)) {
        errors.push(`${name} effects 必须是资源变化对象`);
        return;
      }
      for (const [key, value] of Object.entries(option.effects)) {
        if (!resources.has(key)) errors.push(`${name} 包含未知资源：${key}`);
        if (!Number.isFinite(value)) errors.push(`${name} ${key} 变化量必须是有限数值`);
      }
    });
    // 只证明零现金、其余资源为 100 的基线状态可选，不声称所有可达状态都不会卡住。
    const hasZeroCashOption = options.some((option) => {
      if (!option || !option.effects || typeof option.effects !== "object" || Array.isArray(option.effects))
        return false;
      return Object.entries(option.effects).every(([key, value]) =>
        resources.has(key) && Number.isFinite(value) && value >= (key === "cash" ? 0 : -100),
      );
    });
    if (options.length && !hasZeroCashOption)
      errors.push(`${label} 缺少零现金可选项（精力、健康、保障均为 100 的基线状态）`);
  });

  const counts = {
    events: allEvents.length,
    knowledge: knowledge.length,
    stages: stages.length,
    achievements: achievements.length,
  };
  if (release) {
    if (/demo|test|draft/i.test(content.VERSION || ""))
      errors.push("正式发布禁止使用 demo/test/draft 内容版本");
    if (counts.events < 60) errors.push(`正式内容至少需要 60 个事件，当前 ${counts.events}`);
    if (counts.knowledge < 40) errors.push(`正式内容至少需要 40 条知识，当前 ${counts.knowledge}`);
    if (counts.stages !== 4) errors.push("正式内容必须覆盖 4 个阶段");
    if (counts.achievements !== 8) errors.push("首版必须配置 8 个固定成就");
    const endings = list(content.endings, "正式结局 endings");
    ids(endings, "结局");
    if (endings.length < 4) errors.push("正式内容至少需要 4 条配置化结局规则；引擎内演示结局不代替内容配置");
    for (const item of knowledge) {
      if (!item || typeof item !== "object") continue;
      if (!hasText(item.evidence) || /待|未|演示/.test(item.evidence))
        errors.push(`知识 ${item.id} 证据等级未审核`);
      if (!hasText(item.sourceCommit) || /待|未/.test(item.sourceCommit))
        errors.push(`知识 ${item.id} 尚未锁定来源提交版本`);
    }
  }
  return { errors, counts };
}

function run(content, options) {
  const result = validateContent(content, options);
  if (result.errors.length) {
    console.error("内容基础校验未通过：\n" + result.errors.map((e) => "- " + e).join("\n"));
    return false;
  }
  console.log("✓ 内容基础校验通过：" + JSON.stringify(result.counts));
  return true;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--release")) {
    console.error("用法：node scripts/validate-content.js [--release]");
    process.exitCode = 1;
  } else if (!run(require("../miniapp/content/index"), { release: args.includes("--release") })) {
    process.exitCode = 1;
  }
}
module.exports = { validateContent, run };
