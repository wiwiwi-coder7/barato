import { execFileSync } from "node:child_process";

const clean = value => value.replace(/\u001B\][\s\S]*?(?:\u0007|\u001B\\)/g, "").replace(/\u001B\[[0-?]*[ -/]*[@-~]/g, "");
const run = (args, input) => clean(execFileSync("gh", args, { cwd: new URL("../", import.meta.url), input, encoding: "utf8", env: { ...process.env, NO_COLOR: "1", TERM: "dumb" } }));
const owner = "wiwiwi-coder7";
const repo = "barato";
const branch = "main";
const latest = JSON.parse(run(["api", `repos/${owner}/${repo}/git/ref/heads/${branch}`]));
const baseCommit = JSON.parse(run(["api", `repos/${owner}/${repo}/git/commits/${latest.object.sha}`]));
const tree = JSON.parse(run(["api", `repos/${owner}/${repo}/git/trees/${baseCommit.tree.sha}?recursive=1`]));
const local = execFileSync("git", ["status", "--porcelain"], { cwd: new URL("../", import.meta.url), encoding: "utf8" }).trim().split("\n").filter(Boolean);
const files = local.map(line => ({ status: line.slice(0, 2), path: line.slice(3) }));
const entries = files.map(({ status, path }) => ({ path, mode: "100644", type: "blob", sha: status.includes("D") ? null : undefined }));
for (const entry of entries) {
  if (entry.sha === null) continue;
  const content = execFileSync("git", ["show", `:${entry.path}`], { cwd: new URL("../", import.meta.url), encoding: "utf8" });
  const blob = JSON.parse(run(["api", `repos/${owner}/${repo}/git/blobs`, "-X", "POST", "--input", "-"], JSON.stringify({ content, encoding: "utf-8" })));
  entry.sha = blob.sha;
}
const nextTree = JSON.parse(run(["api", `repos/${owner}/${repo}/git/trees`, "-X", "POST", "--input", "-"], JSON.stringify({ base_tree: baseCommit.tree.sha, tree: entries })));
const commit = JSON.parse(run(["api", `repos/${owner}/${repo}/git/commits`, "-X", "POST", "--input", "-"], JSON.stringify({ message: "Deploy independent Supabase backend and static Pages client", tree: nextTree.sha, parents: [latest.object.sha] })));
run(["api", `repos/${owner}/${repo}/git/refs/heads/${branch}`, "-X", "PATCH", "-f", `sha=${commit.sha}`]);
console.log(commit.html_url);
