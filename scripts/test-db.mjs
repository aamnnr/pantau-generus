// Menjalankan uji pgTAP (supabase/tests/*.sql) ke proyek Supabase DEV yang di-link, tanpa Docker.
//
// `supabase db query --linked` hanya mengembalikan hasil pernyataan terakhir, jadi setiap
// `select` di level atas dikumpulkan ke variabel sesi `tap.out`, lalu di akhir dilempar sebagai
// exception. Exception itu sekaligus me-rollback seluruh transaksi: data dev tidak berubah.
//
// Konvensi file uji: assertion pgTAP ditulis sebagai `select ...;` di awal baris (kolom 0).
// Pernyataan lain (insert, set local role, dll.) tidak boleh diawali `select` di kolom 0.
// File yang sama tetap valid untuk `supabase test db` (pg_prove) di CI.

import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const TEST_DIR = "supabase/tests";
const CLI = "node_modules/supabase/dist/supabase.js";

// `\ir file` (include psql) diganti isi file-nya karena Management API tidak memahami meta-command psql.
function inline(sql) {
  return sql.replace(/^\\ir\s+(\S+)\s*$/gm, (_, f) => inline(readFileSync(join(TEST_DIR, f), "utf8")));
}

function transform(sql) {
  const out = [];
  const lines = inline(sql).split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^\s*(begin|rollback)\s*;\s*$/i.test(line)) continue;
    if (!/^select\b/i.test(line)) {
      out.push(line);
      continue;
    }
    const stmt = [line];
    while (!/;\s*(--.*)?$/.test(stmt.at(-1)) && i + 1 < lines.length) stmt.push(lines[++i]);
    const body = stmt.join("\n").replace(/;\s*(--.*)?$/, "");
    out.push(
      `select set_config('tap.out', coalesce(current_setting('tap.out', true), '') || ` +
        `coalesce((select string_agg(c::text, E'\\n') from (${body}) as _t(c)), '') || E'\\n', true);`,
    );
  }
  return [
    "begin;",
    ...out,
    "reset role;",
    `do $$ begin raise exception 'TAP-START%TAP-END', E'\\n' || current_setting('tap.out', true); end $$;`,
  ].join("\n");
}

function run(file) {
  const dir = mkdtempSync(join(tmpdir(), "pgtap-"));
  const path = join(dir, "test.sql");
  writeFileSync(path, transform(readFileSync(join(TEST_DIR, file), "utf8")));
  const res = spawnSync(process.execPath, [CLI, "db", "query", "--linked", "-f", path], {
    encoding: "utf8",
  });
  const raw = `${res.stdout}\n${res.stderr}`;
  const match = raw.match(/TAP-START([\s\S]*?)TAP-END/);
  if (!match) return { ok: false, output: raw.trim() };

  // Pesan error datang ter-escape JSON (kadang berlapis): \\n → baris baru, \\" → ".
  const tap = match[1].replace(/\\+n/g, "\n").replace(/\\+"/g, '"').trim();
  const plan = tap.match(/^1\.\.(\d+)/m);
  const okCount = (tap.match(/^ok \d+/gm) ?? []).length;
  const failed = /^not ok/m.test(tap) || /Looks like/.test(tap);
  const ok = !!plan && !failed && okCount === Number(plan[1]);
  return { ok, output: tap };
}

const only = process.argv[2];
const files = readdirSync(TEST_DIR)
  .filter((f) => f.endsWith(".sql") && (!only || f.includes(only)))
  .sort();

let gagal = 0;
for (const file of files) {
  const { ok, output } = run(file);
  console.log(`${ok ? "✓" : "✗"} ${file}`);
  if (!ok) {
    gagal++;
    console.log(output.replace(/^/gm, "    "));
  }
}
console.log(`\n${files.length - gagal}/${files.length} file lulus`);
process.exit(gagal ? 1 : 0);
