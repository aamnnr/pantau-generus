// Membuat akun (biasanya admin pertama) langsung lewat secret key Supabase.
// Akun berikutnya dibuat admin dari aplikasi (Tahap 2).
//
//   pnpm akun:buat --nama "Nama Admin" --hp 081234567890 --pin 123456 --peran admin [--kelompok "Nama Kelompok"]
//
// Bila belum ada kelompok, --kelompok wajib dan kelompok baru dibuat.

import { parseArgs } from "node:util";
import { createClient } from "@supabase/supabase-js";

const { values: a } = parseArgs({
  options: {
    nama: { type: "string" },
    hp: { type: "string" },
    pin: { type: "string" },
    peran: { type: "string", multiple: true, default: ["admin"] },
    kelompok: { type: "string" },
  },
});

function gagal(pesan) {
  console.error(`✗ ${pesan}`);
  process.exit(1);
}

const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SECRET_KEY: key, AUTH_EMAIL_DOMAIN: domain } = process.env;
if (!url || !key || !domain || key.endsWith("...")) gagal("Isi NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, AUTH_EMAIL_DOMAIN di .env.local");
if (!a.nama || !a.hp || !a.pin) gagal("Wajib: --nama, --hp, --pin");
if (!/^\d{6}$/.test(a.pin)) gagal("PIN harus 6 angka");

// Sama dengan lib/auth/phone.ts (skrip ini berjalan tanpa bundler TS).
let hp = a.hp.replace(/\D/g, "");
if (hp.startsWith("0")) hp = `62${hp.slice(1)}`;
else if (hp.startsWith("8")) hp = `62${hp}`;
if (!/^628\d{8,11}$/.test(hp)) gagal(`No. HP tidak valid: ${a.hp}`);

const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

let { data: kelompok } = await db.from("kelompok").select("id, nama").limit(1).maybeSingle();
if (!kelompok) {
  if (!a.kelompok) gagal("Belum ada kelompok. Tambahkan --kelompok \"Nama Kelompok\"");
  const res = await db.from("kelompok").insert({ nama: a.kelompok }).select("id, nama").single();
  if (res.error) gagal(res.error.message);
  kelompok = res.data;
  console.log(`✓ Kelompok dibuat: ${kelompok.nama}`);
}

const { data: user, error: errUser } = await db.auth.admin.createUser({
  email: `${hp}@${domain}`,
  password: a.pin,
  email_confirm: true,
});
if (errUser) gagal(errUser.message);

const id = user.user.id;
const errProfil =
  (await db.from("profil").insert({ id, kelompok_id: kelompok.id, nama: a.nama, no_hp: hp })).error ??
  (await db.from("profil_peran").insert(a.peran.map((peran) => ({ kelompok_id: kelompok.id, profil_id: id, peran })))).error;

if (errProfil) {
  // Jangan tinggalkan user auth tanpa profil.
  await db.auth.admin.deleteUser(id);
  gagal(errProfil.message);
}

console.log(`✓ Akun ${a.nama} (${hp}) dibuat dengan peran: ${a.peran.join(", ")}`);
