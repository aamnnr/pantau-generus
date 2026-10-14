import "server-only";
import { createClient } from "@/lib/supabase/server";

export type JadwalRow = Awaited<ReturnType<typeof daftarJadwal>>[number];

export async function daftarJadwal() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jadwal_rutin")
    .select("id, hari, jam_mulai, jam_selesai, aktif, guru:guru_id (nama), jadwal_rutin_kelas (kelas:kelas_id (id, nama, jenjang, urutan))")
    .order("hari")
    .order("jam_mulai");
  if (error) throw error;
  return data.map(({ jadwal_rutin_kelas, ...j }) => ({
    ...j,
    kelas: jadwal_rutin_kelas
      .map((jk) => jk.kelas)
      .filter((k): k is NonNullable<typeof k> => !!k)
      .sort((a, b) => a.jenjang.localeCompare(b.jenjang) || a.urutan - b.urutan),
  }));
}

export async function ambilJadwal(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("jadwal_rutin")
    .select("id, hari, jam_mulai, jam_selesai, guru_id, aktif, jadwal_rutin_kelas (kelas_id)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}
