import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

const owner = "wiwiwi-coder7";
const repo = "barato";
const paths = process.argv.slice(2);
const clean = value => value.replace(/\u001B\][\s\S]*?(?:\u0007|\u001B\\)/g, "").replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, "");
const run = (args, input) => clean(execFileSync("gh", args, { input, encoding: "utf8", env: { ...process.env, NO_COLOR: "1", TERM: "dumb" } }));

for (const path of paths) {
  const existing = JSON.parse(run(["api", `repos/${owner}/${repo}/contents/${path}?ref=main`]));
  const content = await readFile(path);
  run(["api", `repos/${owner}/${repo}/contents/${path}`, "-X", "PUT", "--input", "-"], JSON.stringify({
    message: "Fix GitHub Pages hash routing",
    content: content.toString("base64"),
    sha: existing.sha,
    branch: "main",
  }));
}
