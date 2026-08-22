import { readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const [index, deno, linkEventSecurity] = await Promise.all([
  readFile(new URL("supabase/functions/barato-api/index.ts", root), "utf8"),
  readFile(new URL("supabase/functions/barato-api/deno.json", root), "utf8"),
  readFile(new URL("supabase/functions/barato-api/linkEventSecurity.ts", root), "utf8"),
]);

await writeFile("/tmp/barato-api-deploy.json", JSON.stringify({
  project_id: "qqafgmkxqzjpppczzrac",
  name: "barato-api",
  verify_jwt: false,
  entrypoint_path: "index.ts",
  import_map_path: "deno.json",
  files: [
    { name: "index.ts", content: index },
    { name: "deno.json", content: deno },
    { name: "linkEventSecurity.ts", content: linkEventSecurity },
  ],
}));
