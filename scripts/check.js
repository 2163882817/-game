const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const cp = require("node:child_process");
if (!require("./validate-content").run(require("../miniapp/content/index"))) {
  process.exit(1);
}
const root = path.resolve(__dirname, "..", "miniapp");
let count = 0;
function walk(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((v) =>
      v.isDirectory() ? walk(path.join(dir, v.name)) : [path.join(dir, v.name)],
    );
}
const files = walk(root);
for (const file of files) {
  if (file.endsWith(".js"))
    new vm.Script(fs.readFileSync(file, "utf8"), { filename: file });
  if (file.endsWith(".json")) JSON.parse(fs.readFileSync(file, "utf8"));
  count++;
}
const app = JSON.parse(fs.readFileSync(path.join(root, "app.json")));
for (const route of app.pages)
  for (const ext of [".js", ".wxml"])
    if (!fs.existsSync(path.join(root, route + ext)))
      throw new Error("Missing " + route + ext);
for (const file of files.filter((f) => f.endsWith(".wxml"))) {
  const code = fs.readFileSync(file, "utf8"),
    script = fs.readFileSync(file.replace(/wxml$/, "js"), "utf8");
  for (const m of code.matchAll(
    /(?:bind(?:tap|input|change)|bind:tile)="([a-zA-Z][\w]*)"/g,
  )) {
    if (!new RegExp("\\b" + m[1] + "\\s*[:(]").test(script))
      throw new Error(file + ": missing handler " + m[1]);
  }
}
console.log(
  "✓ " +
    count +
    " files: JavaScript/JSON syntax, " +
    app.pages.length +
    " routes and template event handlers",
);
// 可选：使用本机微信开发者工具内置编译器验证真实WXML/WXSS。
const compiler =
  process.env.WECHAT_COMPILER_DIR ||
  "C:/Program Files (x86)/Tencent/微信web开发者工具/code/package.nw/node_modules/wcc-exec";
for (const [bin, ext] of [
  ["wcc.exe", ".wxml"],
  ["wcsc.exe", ".wxss"],
]) {
  const exe = path.join(compiler, bin);
  if (!fs.existsSync(exe)) {
    console.log(
      "− " + bin + " unavailable; run WeChat DevTools compilation manually.",
    );
    continue;
  }
  const targets = files
    .filter((f) => f.endsWith(ext))
    .map((f) => path.relative(root, f).replace(/\\/g, "/"));
  const result = cp.spawnSync(exe, targets, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(1);
  }
  console.log(
    "✓ WeChat " + bin + ": " + targets.length + " " + ext + " files compiled",
  );
}
