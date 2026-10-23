const PREFIX = "better-life:v1:";
function hash(s) {
  let n = 2166136261;
  for (let i = 0; i < s.length; i++)
    n = Math.imul(n ^ s.charCodeAt(i), 16777619);
  return (n >>> 0).toString(16);
}
function createStorage(api) {
  const read = (key) => {
    try {
      return api.getStorageSync(PREFIX + key) || null;
    } catch (_) {
      return null;
    }
  };
  function load() {
    const valid = ["a", "b"]
      .map((key) => read(key))
      .filter(
        (v) =>
          v &&
          v.payload &&
          v.checksum === hash(JSON.stringify(v.payload)) &&
          v.payload.schemaVersion === 1,
      );
    valid.sort((a, b) => b.payload.revision - a.payload.revision);
    return valid.length ? valid[0].payload : null;
  }
  function save(g) {
    const key = g.revision % 2 ? "b" : "a";
    api.setStorageSync(PREFIX + key, {
      payload: g,
      checksum: hash(JSON.stringify(g)),
    });
  }
  function list(key) {
    const v = read(key);
    return Array.isArray(v) ? v : [];
  }
  function write(key, value) {
    api.setStorageSync(PREFIX + key, value);
  }
  function archive(g) {
    const all = list("history");
    if (!all.some((v) => v.gameId === g.gameId)) {
      all.unshift(g);
      write("history", all);
    }
  }
  // 新局同步写入双槽，避免上一局更大revision在启动时覆盖新局。
  function replace(g) {
    const old = load();
    g.revision = (old ? old.revision : 0) + 1;
    save(g);
    return g;
  }
  return {
    load,
    save,
    list,
    write,
    archive,
    replace,
    hasStored: () => !!read("a") || !!read("b"),
  };
}
module.exports = { createStorage, hash };
