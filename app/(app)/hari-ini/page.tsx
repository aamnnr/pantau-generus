import { SegeraHadir } from "@/components/segera-hadir";

export const metadata = { title: "Pengajian Hari Ini · Pantau Generus" };

export default function Page() {
  return <SegeraHadir judul="Pengajian Hari Ini" tahap={3} isi="Daftar kegiatan hari ini, isi materi, dan kehadiran cepat." />;
}
