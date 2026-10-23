const C = require("../content/index");
const { matchesPreconditions } = require("./conditions");
const clone = (value) => JSON.parse(JSON.stringify(value));
const income = (level) => [0, 400, 650, 950][level];
const upgradeCost = (level) => [0, 1200, 1800][level] || 0;
// 临时演示口径：所有等级残值1500，升级款不回收。正式口径待确认。
const salvage = () => 1500;
const initial = () => ({ cash: 6000, energy: 80, health: 80, protection: 50 });
function start(seed = Date.now()) {
  return {
    schemaVersion: 1,
    gameId: "life-" + seed,
    contentVersion: C.VERSION,
    revision: 0,
    phase: "READY",
    round: 1,
    stage: 1,
    position: 0,
    resources: initial(),
    stageStart: initial(),
    assets: [],
    flags: [],
    randomSeed: seed >>> 0,
    draw: 0,
    roll: null,
    eventId: null,
    history: [],
    stageReports: [],
    aidUsed: false,
    totalIncome: 0,
    updatedAt: Date.now(),
  };
}
function random(g) {
  g.randomSeed = (Math.imul(g.randomSeed, 1664525) + 1013904223) >>> 0;
  g.draw++;
  return g.randomSeed / 4294967296;
}
function apply(g, effects, reason) {
  const changes = [];
  Object.keys(effects).forEach((key) => {
    const before = g.resources[key];
    const after = Math.max(
      0,
      Math.min(
        key === "cash" ? Number.MAX_SAFE_INTEGER : 100,
        before + effects[key],
      ),
    );
    g.resources[key] = after;
    changes.push({
      key,
      before,
      after,
      delta: after - before,
      reason,
      capped: after - before !== effects[key],
    });
  });
  return changes;
}
function event(g) {
  const found = C.events.concat(C.mains, C.fallbackEvents).find((e) => e.id === g.eventId);
  if (!found) return undefined;
  const e = clone(found);
  if (e.id === "e6" && g.flags.includes("contract")) {
    e.context =
      "之前你留下了核对合同的记录。如今服务内容有些出入，这些记录可以帮助你说明当时的约定。";
    e.options[0].effects.protection = 8;
    e.options[0].result =
      "之前核对并保存的合同派上了用场。你整理条款后沟通，对方确认了约定的服务内容。";
  }
  return e;
}
function optionAvailability(g, o) {
  const labels = { cash: "现金", energy: "精力", health: "健康", protection: "保障" };
  if (!o || !o.effects || typeof o.effects !== "object" || Array.isArray(o.effects) ||
      Object.entries(o.effects).some(([key, delta]) =>
        !Object.prototype.hasOwnProperty.call(labels, key) ||
        !Number.isFinite(delta) || !Number.isFinite(g.resources[key]),
      )) return { allowed: false, shortages: [], reason: "选项配置不可用" };
  const shortages = Object.entries(o.effects)
    .filter(([key, delta]) => delta < 0 && g.resources[key] < -delta)
    .map(([key, delta]) => ({
      key,
      required: -delta,
      current: g.resources[key],
      missing: -delta - g.resources[key],
    }));
  const reason = shortages.map(({ key, missing }) =>
    key === "cash"
      ? `现金还差 ¥${missing.toLocaleString("en-US")}`
      : `${labels[key]}还差 ${missing} 点`,
  ).join("；");
  return { allowed: shortages.length === 0, shortages, reason };
}
function eligible(g, o) {
  return optionAvailability(g, o).allowed;
}
function eventCandidates(g, content = C) {
  const pool = content.events.filter((e) =>
    e.stage === g.stage && matchesPreconditions(g, e.preconditions) &&
    e.options.some((option) => eligible(g, option)),
  );
  const unseen = pool.filter((e) => !g.history.some((h) => h.eventId === e.id));
  if (pool.length) return unseen.length ? unseen : pool;
  const id = content.fallbackMap[g.stage] && content.fallbackMap[g.stage].event;
  const fallback = content.fallbackEvents.find((e) => e.id === id && e.stage === g.stage);
  if (!fallback || !matchesPreconditions(g, fallback.preconditions) ||
      !fallback.options.some((option) => eligible(g, option)))
    throw new Error("当前阶段缺少可执行的保底事件，请保留存档并联系开发者。");
  return [fallback];
}
function finish(g, title, text, changes, knowledgeId) {
  g.result = {
    title,
    text,
    changes: changes || [],
    knowledgeId: knowledgeId || "k2",
  };
  g.history.push({
    round: g.round,
    title,
    text,
    changes: g.result.changes,
    knowledgeId: g.result.knowledgeId,
    main: !!g.isMain,
  });
  g.phase = "RESULT";
}
function command(snapshot, type, payload = {}) {
  const g = clone(snapshot);
  if (g.contentVersion !== C.VERSION)
    throw new Error("该内容版本暂不可用，请保留存档并联系开发者。");
  switch (type) {
    case "ROLL": {
      if (g.phase !== "READY") return snapshot;
      const recovery = [];
      ["energy", "health"].forEach((k) => {
        if (g.resources[k] <= 20)
          recovery.push(...apply(g, { [k]: 20 }, "回合前休整"));
      });
      const dice = Math.floor(random(g) * 6) + 1;
      const path = Array.from(
        { length: dice },
        (_, i) => (g.position + i + 1) % 16,
      );
      const choices = eventCandidates(g);
      g.eventId = choices[Math.floor(random(g) * choices.length)].id;
      g.roll = { dice, path, from: g.position, changes: recovery };
      g.phase = "MOVING";
      g.isMain = false;
      break;
    }
    case "LAND": {
      if (g.phase !== "MOVING") return snapshot;
      let changes = g.roll.changes;
      if (g.roll.path.includes(0)) {
        const earnings = g.assets.reduce((n, a) => n + income(a.level), 0);
        changes = changes.concat(
          apply(g, { cash: 2000 + earnings }, "经过起点：工资及资产收益"),
        );
        g.totalIncome += earnings;
      }
      g.position = g.roll.path[g.roll.path.length - 1];
      g.roll.changes = changes;
      const tile = C.board[g.position];
      if (tile.type === "event") {
        g.phase = "CHOOSING";
        break;
      }
      if (tile.type === "asset") {
        if (!g.assets.some((a) => a.tileId === tile.id)) {
          g.phase = "ASSET_OFFER";
          break;
        }
        finish(
          g,
          "又走到了自己的" + tile.name,
          "这处资产会在经过起点时发放固定收益。重复落格不另收费。",
          changes,
        );
        break;
      }
      if (tile.type === "protection") {
        g.phase = "PROTECTION";
        break;
      }
      const effects = {
        work: { cash: 600, energy: -8 },
        park: { energy: 8 },
        rest: { health: 8 },
        supply: { cash: -200, energy: 15 },
        bill: { cash: -300 },
        start: {},
      }[tile.type];
      if (effects.cash && g.resources.cash < -effects.cash) {
        g.phase = "RECOVERY";
        g.debt = -effects.cash;
        g.pendingTile = tile.type;
        break;
      }
      changes = changes.concat(apply(g, effects, "落格：" + tile.name));
      finish(
        g,
        tile.name + "，生活的一小步",
        {
          work: "完成一段工作，获得报酬，也消耗了一些精力。",
          park: "在公园走一走，给精力充个电。",
          rest: "好好休息了一会儿，状态恢复了一些。",
          supply: "补充了日用品和食物，精力也回来了一些。",
          bill: "付清了这一笔生活账单。",
          start: "经过起点，工资和已有资产收益已一并发放。",
        }[tile.type],
        changes,
        tile.type === "rest" ? "k5" : "k2",
      );
      break;
    }
    case "CHOOSE": {
      if (g.phase !== "CHOOSING") return snapshot;
      const e = event(g),
        o = e.options.find((v) => v.id === payload.id);
      if (!o) throw new Error("该选项已不可用，请重新选择。");
      const availability = optionAvailability(g, o);
      if (!availability.allowed) throw new Error(availability.reason + "，请选择其他方案。");
      if (o.flag && !g.flags.includes(o.flag)) g.flags.push(o.flag);
      finish(
        g,
        o.label,
        o.result,
        (g.isMain ? [] : g.roll.changes).concat(apply(g, o.effects, o.label)),
        e.knowledgeId,
      );
      g.history[g.history.length - 1].eventId = e.id;
      break;
    }
    case "BUY": {
      if (g.phase !== "ASSET_OFFER") return snapshot;
      if (payload.buy) {
        if (g.resources.cash < 3000)
          throw new Error("现金不足 ¥3,000，可以暂不购买。");
        g.assets.push({ tileId: g.position, level: 1, lastUpgradeRound: 0 });
      }
      finish(
        g,
        payload.buy ? "购入" + C.board[g.position].name : "把现金留在手边",
        payload.buy
          ? "每次经过起点，增加 ¥400 固定收益。"
          : "这次选择暂不购买，之后路过仍有机会。",
        g.roll.changes.concat(
          payload.buy ? apply(g, { cash: -3000 }, "购买资产") : [],
        ),
      );
      break;
    }
    case "PROTECT": {
      if (g.phase !== "PROTECTION") return snapshot;
      if (payload.buy && g.resources.cash < 200)
        throw new Error("现金不足，可跳过本次保障。");
      finish(
        g,
        payload.buy ? "补上一份保障" : "这次先保留现金",
        payload.buy ? "花费 ¥200，游戏保障状态提升。" : "你没有额外支出。",
        g.roll.changes.concat(
          payload.buy ? apply(g, { cash: -200, protection: 10 }, "保障格") : [],
        ),
        "k3",
      );
      break;
    }
    case "RECOVER": {
      if (g.phase !== "RECOVERY") return snapshot;
      let changes = g.roll.changes;
      if (payload.method === "aid") {
        if (g.aidUsed) throw new Error("本局援助已使用。");
        g.aidUsed = true;
        changes = changes.concat(apply(g, { cash: 1000 }, "免费应急援助"));
      } else if (payload.method !== "waive")
        throw new Error("请选择援助或差额减免。");
      const paid = Math.min(g.debt, g.resources.cash),
        waived = g.debt - paid;
      changes = changes.concat(
        apply(
          g,
          {
            cash: -paid,
            ...(g.pendingTile === "supply" ? { energy: 15 } : {}),
          },
          "支付账单",
        ),
      );
      finish(
        g,
        "先渡过眼前的难关",
        waived
          ? "本次减免 ¥" + waived + "。你可以继续生活，没有额外债务。"
          : "账单已结清，接下来可以重新安排。",
        changes,
      );
      g.debt = 0;
      break;
    }
    case "NEXT": {
      if (g.phase !== "RESULT") return snapshot;
      if (g.round % 6 === 0) {
        if (!g.isMain) {
          g.isMain = true;
          g.eventId = "main" + (g.stage - 1);
          g.phase = "CHOOSING";
          break;
        }
        g.stageReports.push({
          stage: g.stage,
          round: g.round,
          before: g.stageStart,
          after: clone(g.resources),
          choices: g.history.filter((h) => h.round > g.round - 6),
        });
        g.phase = "STAGE_REPORT";
        break;
      }
      g.round++;
      g.phase = "READY";
      g.roll = null;
      break;
    }
    case "NEXT_STAGE": {
      if (g.phase !== "STAGE_REPORT") return snapshot;
      if (g.round === 24) {
        g.phase = "ENDING";
        g.ending = ending(g);
        break;
      }
      g.round++;
      g.stage++;
      g.stageStart = clone(g.resources);
      g.phase = "READY";
      g.roll = null;
      break;
    }
    case "UPGRADE": {
      if (!["READY", "RESULT"].includes(g.phase) || g.history.length === 0)
        throw new Error("落格结算后才可升级。");
      const a = g.assets.find((v) => v.tileId === payload.id);
      if (!a || a.level >= 3 || a.lastUpgradeRound === g.round)
        throw new Error("本回合暂不可升级这处资产。");
      const cost = upgradeCost(a.level);
      if (g.resources.cash < cost) throw new Error("现金不足，先留一点余地。");
      apply(g, { cash: -cost }, "升级资产");
      a.level++;
      a.lastUpgradeRound = g.round;
      g.upgraded = true;
      break;
    }
    case "SELL": {
      if (!["READY", "RESULT", "RECOVERY"].includes(g.phase))
        throw new Error("当前需要先完成落格处理。");
      const a = g.assets.find((v) => v.tileId === payload.id);
      if (!a) return snapshot;
      apply(g, { cash: salvage(a.level) }, "出售资产");
      g.assets = g.assets.filter((v) => v !== a);
      break;
    }
    default:
      throw new Error("未知的游戏操作。");
  }
  g.revision++;
  g.updatedAt = Date.now();
  return g;
}
function ending(g) {
  if (g.resources.energy >= 65 && g.resources.health >= 70)
    return {
      id: "balance",
      title: "日子有节奏，也有留白",
      text: "你为工作与休息都留出了空间，找到了一种适合自己的节奏。",
    };
  if (g.resources.protection >= 75)
    return {
      id: "secure",
      title: "有积蓄，也留了余地",
      text: "你在选择中留意约定与保障，给接下来的生活多准备了几条路。",
    };
  if (g.assets.length >= 2)
    return {
      id: "builder",
      title: "一点一点，经营出底气",
      text: "你把一部分资源放进长期经营里，也体验了现金与固定收益之间的取舍。",
    };
  return {
    id: "explorer",
    title: "走过这一程，更了解自己",
    text: "你经历了不同的生活处境，也更清楚下一次想把力气放在哪里。",
  };
}
module.exports = {
  start,
  command,
  event,
  eligible,
  optionAvailability,
  income,
  upgradeCost,
  salvage,
  ending,
  eventCandidates,
};
