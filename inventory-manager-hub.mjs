// inventory-manager-hub.mjs
import fs from "node:fs";
import path from "node:path";

const FRONT_DIR = "frontend/src/pages/Hub/Manager";
const BACK_DIR = "backend/server/hubs/manager";

const isText = (p) => /\.(tsx?|jsx?|mjs|cjs|json|sql|md)$/i.test(p);
const readLines = (p, n=50) => {
  try {
    const txt = fs.readFileSync(p, "utf8");
    return txt.split(/\r?\n/).slice(0, n).join("\n");
  } catch { return ""; }
};

const walk = (dir) => {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) stack.push(p);
      else if (isText(p)) out.push(p);
    }
  }
  return out;
};

const rel = (p) => p.replace(process.cwd() + path.sep, "");

function analyzeFile(filepath) {
  const ext = path.extname(filepath).toLowerCase();
  let src = "";
  try { src = fs.readFileSync(filepath, "utf8"); } catch {}
  const first50 = readLines(filepath, 50);

  // API calls (fetch/axios/swr/react-query)
  const apiCalls = [];
  const apiRegexes = [
    /fetch\(\s*(['"`])([^'"`]+)\1/gi,
    /axios\.(get|post|put|delete|patch)\(\s*(['"`])([^'"`]+)\2/gi,
    /axios\(\s*\{\s*url:\s*(['"`])([^'"`]+)\1/gi,
    /useSWR\(\s*(['"`])([^'"`]+)\1/gi,
    /useQuery\(\s*[\[\s]*(['"`])([^'"`]+)\1/gi
  ];
  for (const r of apiRegexes) {
    let m;
    while ((m = r.exec(src))) {
      apiCalls.push(m[2] ?? m[3] ?? m[1]);
    }
  }

  // Backend routes
  const routes = [];
  const routeRegex = /\brouter\.(get|post|put|delete|patch)\s*\(\s*(['"`])([^'"`]+)\2/gi;
  let rm;
  while ((rm = routeRegex.exec(src))) {
    routes.push(`${rm[1].toUpperCase()} ${rm[3]}`);
  }

  // DB tables/queries (prisma/sql/knex-ish)
  const dbRefs = [];
  const dbRegexes = [
    /\bprisma\.(\w+)\./g,
    /\bfrom\s+(['"`])([^'"`]+)\1/gi,     // SQL-ish
    /\bUPDATE\s+([A-Za-z0-9_]+)/gi,
    /\bINSERT\s+INTO\s+([A-Za-z0-9_]+)/gi,
    /\bDELETE\s+FROM\s+([A-Za-z0-9_]+)/gi
  ];
  for (const r of dbRegexes) {
    let m;
    while ((m = r.exec(src))) {
      dbRefs.push(m[1] || m[2]);
    }
  }

  // TS interfaces/types (exported or local)
  const tsTypes = [];
  const typeRegexes = [
    /\bexport\s+interface\s+([A-Za-z0-9_]+)/g,
    /\binterface\s+([A-Za-z0-9_]+)/g,
    /\bexport\s+type\s+([A-Za-z0-9_]+)/g,
    /\btype\s+([A-Za-z0-9_]+)\s*=/g
  ];
  for (const r of typeRegexes) {
    let m;
    while ((m = r.exec(src))) tsTypes.push(m[1]);
  }

  // External deps (bare imports, not relative)
  const externals = [];
  const importRegex = /\bimport\s+.*?from\s+(['"`])([^'"`]+)\1/g;
  let im;
  while ((im = importRegex.exec(src))) {
    const spec = im[2];
    if (!spec.startsWith(".") && !spec.startsWith("/")) externals.push(spec);
  }

  // React components consumed (heuristic: PascalCase in JSX from imports outside Manager path)
  // We’ll just list imported identifiers; exact “outside Manager” check is expensive without graph.
  // Instead, we will mark any import that is not relative as “external component/library”.
  const componentsConsumed = []; // leave for future refinement if needed

  return {
    path: rel(filepath),
    first50,
    apiCalls: [...new Set(apiCalls)],
    routes: [...new Set(routes)],
    dbRefs: [...new Set(dbRefs)],
    tsTypes: [...new Set(tsTypes)],
    externals: [...new Set(externals)],
    componentsConsumed
  };
}

function listSharedUtilities(allFiles) {
  // Any relative import that escapes Manager dir is “shared”
  const shared = new Set();
  for (const f of allFiles) {
    let src = "";
    try { src = fs.readFileSync(f, "utf8"); } catch {}
    const dir = path.dirname(f);
    const importRegex = /\bimport\s+.*?from\s+(['"`])([^'"`]+)\1/g;
    let m;
    while ((m = importRegex.exec(src))) {
      const spec = m[2];
      if (spec.startsWith(".") || spec.startsWith("/")) {
        const p = path.resolve(dir, spec);
        if (!p.includes(path.resolve(FRONT_DIR)) && !p.includes(path.resolve(BACK_DIR))) {
          shared.add(rel(p));
        }
      }
    }
  }
  return [...shared].sort();
}

const frontFiles = walk(FRONT_DIR);
const backFiles = walk(BACK_DIR);
const allFiles = [...frontFiles, ...backFiles];

const analyses = allFiles.map(analyzeFile);

// Collect API endpoints under /api/manager
const apiEndpointList = new Set();
for (const a of analyses) {
  for (const call of a.apiCalls) {
    if (/^\/?api\/manager\//.test(call)) {
      apiEndpointList.add(`[UNK] ${call}`); // method unknown from fetch, we’ll fill via routes below
    }
  }
  for (const r of a.routes) {
    if (r.includes("/api/manager/")) apiEndpointList.add(r);
  }
}

// Shared utilities/hooks imported
const sharedUtils = listSharedUtilities(allFiles);

// Aggregate lists
const dbTables = new Set();
const typeNames = new Set();
const externalDeps = new Set();

for (const a of analyses) {
  a.dbRefs.forEach((t) => dbTables.add(t));
  a.tsTypes.forEach((t) => typeNames.add(t));
  a.externals.forEach((e) => externalDeps.add(e));
}

// Write Markdown
const out = [];
out.push("# Manager Hub Inventory\n");

out.push("## File inventory (with code snippets + dependencies)\n");
for (const a of analyses) {
  out.push(`### ${a.path}`);
  out.push(`<details><summary>First 50 lines</summary>\n\n\`\`\`${path.extname(a.path).slice(1) || "txt"}\n${a.first50}\n\`\`\`\n</details>`);
  if (a.apiCalls.length) out.push(`- API calls: ${a.apiCalls.map(s=>`\`${s}\``).join(", ")}`);
  if (a.routes.length) out.push(`- Backend routes: ${a.routes.map(s=>`\`${s}\``).join(", ")}`);
  if (a.dbRefs.length) out.push(`- DB refs: ${a.dbRefs.map(s=>`\`${s}\``).join(", ")}`);
  if (a.tsTypes.length) out.push(`- TS types: ${a.tsTypes.map(s=>`\`${s}\``).join(", ")}`);
  if (a.externals.length) out.push(`- External deps: ${a.externals.map(s=>`\`${s}\``).join(", ")}`);
  out.push("");
}

out.push("## API endpoint list\n");
if (apiEndpointList.size === 0) out.push("_None found_");
else for (const ep of [...apiEndpointList].sort()) out.push(`- ${ep}`);

out.push("\n## Database tables list\n");
out.push([...dbTables].length ? [...dbTables].sort().map(t=>`- \`${t}\``).join("\n") : "_None found_");

out.push("\n## Type/interface list\n");
out.push([...typeNames].length ? [...typeNames].sort().map(t=>`- \`${t}\``).join("\n") : "_None found_");

out.push("\n## External dependency list\n");
out.push([...externalDeps].length ? [...externalDeps].sort().map(t=>`- \`${t}\``).join("\n") : "_None found_");

out.push("\n## Shared utilities/hooks imported\n");
out.push(sharedUtils.length ? sharedUtils.map(p=>`- \`${p}\``).join("\n") : "_None detected (relative imports stay within Manager folders)_");

fs.writeFileSync("manager-hub-inventory.md", out.join("\n"));
console.log("Wrote manager-hub-inventory.md");
