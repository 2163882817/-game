const resourceNames = ["cash", "energy", "health", "protection"];
const record = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

// 只读取声明式白名单字段；不执行内容中的字符串或脚本。
function validatePreconditions(condition) {
  if (condition === undefined) return [];
  if (!record(condition)) return ["触发条件必须是对象"];
  const errors = [];
  for (const key of Object.keys(condition))
    if (!["allFlags", "noneFlags", "resources"].includes(key)) errors.push(`未知触发条件字段：${key}`);
  for (const key of ["allFlags", "noneFlags"]) {
    if (condition[key] === undefined) continue;
    if (!Array.isArray(condition[key]) || condition[key].some((flag) =>
      typeof flag !== "string" || !/^[a-zA-Z0-9_-]+$/.test(flag),
    )) errors.push(`${key} 必须是标记 ID 数组`);
    else if (new Set(condition[key]).size !== condition[key].length) errors.push(`${key} 包含重复标记`);
  }
  if (Array.isArray(condition.allFlags) && Array.isArray(condition.noneFlags) &&
      condition.allFlags.some((flag) => condition.noneFlags.includes(flag)))
    errors.push("同一标记不能同时要求存在和不存在");
  if (condition.resources !== undefined) {
    if (!record(condition.resources)) errors.push("resources 条件必须是对象");
    else for (const [name, bounds] of Object.entries(condition.resources)) {
      if (!resourceNames.includes(name)) {
        errors.push(`未知条件资源：${name}`);
        continue;
      }
      if (!record(bounds) || !Object.keys(bounds).length) {
        errors.push(`${name} 条件必须配置 min 或 max`);
        continue;
      }
      for (const key of Object.keys(bounds)) {
        if (!["min", "max"].includes(key)) errors.push(`${name} 未知范围字段：${key}`);
        else if (!Number.isFinite(bounds[key]) || bounds[key] < 0 ||
                 bounds[key] > (name === "cash" ? Number.MAX_SAFE_INTEGER : 100))
          errors.push(`${name}.${key} 必须是有效资源范围内的有限数值`);
      }
      if (Number.isFinite(bounds.min) && Number.isFinite(bounds.max) && bounds.min > bounds.max)
        errors.push(`${name} 的 min 不能大于 max`);
    }
  }
  return errors;
}

function matchesPreconditions(snapshot, condition) {
  if (validatePreconditions(condition).length) return false;
  if (condition === undefined) return true;
  const flags = Array.isArray(snapshot.flags) ? snapshot.flags : [];
  if ((condition.allFlags || []).some((flag) => !flags.includes(flag))) return false;
  if ((condition.noneFlags || []).some((flag) => flags.includes(flag))) return false;
  return Object.entries(condition.resources || {}).every(([name, bounds]) => {
    const value = snapshot.resources && snapshot.resources[name];
    return Number.isFinite(value) &&
      (bounds.min === undefined || value >= bounds.min) &&
      (bounds.max === undefined || value <= bounds.max);
  });
}

module.exports = { validatePreconditions, matchesPreconditions };
