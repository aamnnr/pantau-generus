import "server-only";
import { createClient } from "@/lib/supabase/server";
import { hariIni, type Aspek, type JenisKelamin, type StatusPenilaian } from "@/lib/format";

export type Rentang = { mulai: number; selesai: number; teks: string };

export type BarisPenilaian = {
  generus_id: string;
  materi_item_id: string;
  judul: string;
  keterangan: string;
  aspek: Aspek;
  status: StatusPenilaian | null;
  diterima: boolean;
  target: boolean;
};

const cocokJenisKelamin = (item: JenisKelamin | null, anak: JenisKelamin) => !item || item === anak;

/** Target periode yang sedang berjalan untuk sebuah kelas (periode tidak bertumpukan, jadi paling banyak satu). */
async function targetBerjalan(kelasId: string, hari: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("target_bulanan_kelas")
    .select("target:target_bulanan_id (id, judul, mulai, selesai)")
    .eq("kelas_id", kelasId);
  if (error) throw error;
  return data.map((x) => x.target).find((t) => t && t.mulai <= hari && t.selesai >= hari) ?? null;
}

/**
 * Semua data layar Progres Anak (DESIGN §7.5). Angka progres dihitung di SQL (ARCHITECTURE §5);
 * di sini hanya digabung untuk ditampilkan.
 */
export async function ambilProgresAnak(id: string) {
  const supabase = await createClient();
  const { data: anak, error } = await supabase
    .from("generus")
    .select("id, nama, jenis_kelamin, status, kelas:kelas_id (id, nama, jenjang)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!anak) return null;

  const hari = hariIni();
  const awalBulan = `${hari.slice(0, 8)}01`;
  const [progres, bulanIni, semua, pengaturan, target, penilaian, diterima, posisi, susulan, boleh] = await Promise.all([
    supabase.rpc("fn_progres_anak", { p_generus_id: id }),
    supabase.rpc("fn_rekap_presensi", { p_generus_id: id, p_dari: awalBulan, p_sampai: hari }).single(),
    supabase.rpc("fn_rekap_presensi", { p_generus_id: id, p_dari: "2000-01-01", p_sampai: hari }).single(),
    supabase.from("pengaturan").select("ambang_kehadiran").maybeSingle(),
    anak.kelas ? targetBerjalan(anak.kelas.id, hari) : Promise.resolve(null),
    supabase.from("v_penilaian_terakhir").select("materi_item_id, status").eq("generus_id", id),
    supabase.from("v_materi_item_diterima").select("materi_item_id").eq("generus_id", id),
    supabase.from("v_posisi_tilawati").select("jilid, halaman, total_halaman").eq("generus_id", id).maybeSingle(),
    supabase.from("v_susulan").select("id, kitab_nama, jenis, teks, tanggal, guru_nama").eq("generus_id", id).order("tanggal", { ascending: false }),
    supabase.rpc("boleh_nilai_generus", { p_generus_id: id }),
  ]);
  for (const r of [progres, bulanIni, semua, penilaian, diterima, posisi, susulan]) if (r.error) throw r.error;

  const kitab = (progres.data ?? []).map((p) => ({ ...p, terlewat: (p.terlewat ?? []) as Rentang[] }));
  const jenisQuran = [...new Set(kitab.filter((k) => k.kitab_jenis === "quran").map((k) => k.jenis))];

  const [perSurat, capaianTarget, targetMateri, targetTilawati] = await Promise.all([
    Promise.all(
      jenisQuran.map(async (jenis) => {
        const { data, error: e } = await supabase.rpc("fn_progres_quran_per_surat", { p_generus_id: id, p_jenis: jenis });
        if (e) throw e;
        return [jenis, data] as const;
      }),
    ),
    target ? supabase.rpc("fn_capaian_target_kitab", { p_generus_id: id, p_target_id: target.id }) : null,
    target ? supabase.from("target_materi").select("materi_item_id").eq("target_bulanan_id", target.id) : null,
    target ? supabase.from("target_tilawati").select("jilid, halaman").eq("target_bulanan_id", target.id).maybeSingle() : null,
  ]);
  for (const r of [capaianTarget, targetMateri, targetTilawati]) if (r?.error) throw r.error;

  // Butir yang ditampilkan: target periode ini ∪ yang sudah diterima ∪ yang sudah pernah dinilai.
  const idTarget = new Set((targetMateri?.data ?? []).map((x) => x.materi_item_id));
  const idDiterima = new Set((diterima.data ?? []).map((x) => x.materi_item_id!));
  const statusById = new Map((penilaian.data ?? []).map((x) => [x.materi_item_id!, x.status!]));
  const semuaId = [...new Set([...idTarget, ...idDiterima, ...statusById.keys()])];
  const { data: items, error: errItem } = semuaId.length
    ? await supabase.from("materi_item").select("id, nama, aspek, mapel, jenis_kelamin, urutan").in("id", semuaId).order("mapel").order("urutan").order("nama")
    : { data: [], error: null };
  if (errItem) throw errItem;

  const materi: BarisPenilaian[] = items
    .filter((m) => cocokJenisKelamin(m.jenis_kelamin, anak.jenis_kelamin))
    .map((m) => ({
      generus_id: id,
      materi_item_id: m.id,
      judul: m.nama,
      keterangan: m.mapel,
      aspek: m.aspek,
      status: statusById.get(m.id) ?? null,
      diterima: idDiterima.has(m.id),
      target: idTarget.has(m.id),
    }));

  return {
    anak,
    kitab,
    perSurat: Object.fromEntries(perSurat) as Partial<Record<"makna" | "bacaan", NonNullable<(typeof perSurat)[number][1]>>>,
    kehadiran: { bulanIni: bulanIni.data, semua: semua.data, ambang: pengaturan.data?.ambang_kehadiran ?? 60 },
    target: target && {
      ...target,
      kitab: capaianTarget?.data ?? [],
      tilawati: targetTilawati?.data ?? null,
    },
    materi,
    tilawati: posisi.data,
    susulan: susulan.data ?? [],
    bolehNilai: !!boleh.data,
  };
}

export type ProgresAnak = NonNullable<Awaited<ReturnType<typeof ambilProgresAnak>>>;

/** Anak yang terhubung ke akun wali saat ini (RLS: wali hanya melihat anaknya). */
export async function daftarAnakku(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("generus_wali")
    .select("generus:generus_id (id, nama, status, kelas:kelas_id (nama, jenjang))")
    .eq("profil_id", userId);
  if (error) throw error;
  return data
    .map((x) => x.generus)
    .filter((g): g is NonNullable<typeof g> => !!g)
    .sort((a, b) => a.nama.localeCompare(b.nama, "id"));
}

// ── Penilaian per kelas / per kegiatan ──────────────────────────────

export type OpsiPenilaian = { id: string; nama: string; aspek: Aspek; mapel: string; target: boolean };

/** Butir yang bisa dinilai di sebuah kelas: butir aktif jenjangnya; butir target periode berjalan ditandai. */
export async function opsiPenilaianKelas(kelas: { id: string; jenjang: string }): Promise<OpsiPenilaian[]> {
  const supabase = await createClient();
  const target = await targetBerjalan(kelas.id, hariIni());
  const [{ data, error }, tm] = await Promise.all([
    supabase.from("materi_item").select("id, nama, aspek, mapel, jenjang").eq("aktif", true).order("aspek").order("mapel").order("urutan").order("nama"),
    target ? supabase.from("target_materi").select("materi_item_id").eq("target_bulanan_id", target.id) : null,
  ]);
  if (error) throw error;
  if (tm?.error) throw tm.error;
  const idTarget = new Set((tm?.data ?? []).map((x) => x.materi_item_id));
  return data
    .filter((m) => idTarget.has(m.id) || !m.jenjang || m.jenjang === kelas.jenjang)
    .map((m) => ({ id: m.id, nama: m.nama, aspek: m.aspek, mapel: m.mapel, target: idTarget.has(m.id) }));
}

/**
 * Baris penilaian satu butir untuk sekelompok anak: anak aktif sebuah kelas,
 * atau anak yang hadir/terlambat di sebuah kegiatan. Butir khusus putra/putri hanya untuk yang sesuai.
 */
export async function barisPenilaianButir(sumber: { kelasId: string } | { kegiatanId: string }, itemId: string) {
  const supabase = await createClient();
  const { data: item, error: errItem } = await supabase
    .from("materi_item")
    .select("id, nama, aspek, mapel, jenis_kelamin")
    .eq("id", itemId)
    .maybeSingle();
  if (errItem) throw errItem;
  if (!item) return null;

  let anak: { id: string; nama: string; jenis_kelamin: JenisKelamin }[];
  if ("kelasId" in sumber) {
    const { data, error } = await supabase.from("generus").select("id, nama, jenis_kelamin").eq("kelas_id", sumber.kelasId).eq("status", "aktif").order("nama");
    if (error) throw error;
    anak = data;
  } else {
    const { data, error } = await supabase
      .from("presensi")
      .select("generus:generus_id (id, nama, jenis_kelamin)")
      .eq("kegiatan_id", sumber.kegiatanId)
      .in("status", ["hadir", "terlambat"]);
    if (error) throw error;
    anak = data
      .map((p) => p.generus)
      .filter((g): g is NonNullable<typeof g> => !!g)
      .sort((a, b) => a.nama.localeCompare(b.nama, "id"));
  }
  anak = anak.filter((a) => cocokJenisKelamin(item.jenis_kelamin, a.jenis_kelamin));

  const ids = anak.length ? anak.map((a) => a.id) : ["00000000-0000-0000-0000-000000000000"];
  const [nilai, terima] = await Promise.all([
    supabase.from("v_penilaian_terakhir").select("generus_id, status").eq("materi_item_id", itemId).in("generus_id", ids),
    supabase.from("v_materi_item_diterima").select("generus_id").eq("materi_item_id", itemId).in("generus_id", ids),
  ]);
  if (nilai.error) throw nilai.error;
  if (terima.error) throw terima.error;
  const statusById = new Map(nilai.data.map((x) => [x.generus_id!, x.status!]));
  const diterima = new Set(terima.data.map((x) => x.generus_id!));

  return {
    item,
    baris: anak.map(
      (a): BarisPenilaian => ({
        generus_id: a.id,
        materi_item_id: item.id,
        judul: a.nama,
        keterangan: diterima.has(a.id) ? "Sudah menerima" : "Belum menerima di pengajian",
        aspek: item.aspek,
        status: statusById.get(a.id) ?? null,
        diterima: diterima.has(a.id),
        target: false,
      }),
    ),
  };
}

// ── Tilawati dalam kegiatan ─────────────────────────────────────────

export type BarisTilawati = {
  generus_id: string;
  nama: string;
  posisi: { jilid: number; halaman: number; total_halaman: number | null } | null;
};

/** Anak Caberawit yang hadir/terlambat di kegiatan, beserta posisi tilawatinya (DESIGN §7.4a). */
export async function tilawatiKegiatan(kegiatanId: string, kelasCaberawit: string[]): Promise<BarisTilawati[]> {
  if (kelasCaberawit.length === 0) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("presensi")
    .select("generus:generus_id (id, nama, kelas_id)")
    .eq("kegiatan_id", kegiatanId)
    .in("status", ["hadir", "terlambat"]);
  if (error) throw error;
  const anak = data
    .map((p) => p.generus)
    .filter((g): g is NonNullable<typeof g> => !!g && !!g.kelas_id && kelasCaberawit.includes(g.kelas_id))
    .sort((a, b) => a.nama.localeCompare(b.nama, "id"));
  if (anak.length === 0) return [];

  const { data: posisi, error: errPos } = await supabase
    .from("v_posisi_tilawati")
    .select("generus_id, jilid, halaman, total_halaman")
    .in("generus_id", anak.map((a) => a.id));
  if (errPos) throw errPos;
  const byId = new Map(posisi.map((p) => [p.generus_id!, p]));
  return anak.map((a) => {
    const p = byId.get(a.id);
    return {
      generus_id: a.id,
      nama: a.nama,
      posisi: p ? { jilid: p.jilid!, halaman: p.halaman!, total_halaman: p.total_halaman } : null,
    };
  });
}
