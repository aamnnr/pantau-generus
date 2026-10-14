export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      capaian_tilawati: {
        Row: {
          created_at: string
          dinilai_oleh: string | null
          generus_id: string
          halaman: number
          id: string
          jenis: Database["public"]["Enums"]["jenis_capaian_tilawati"]
          jilid: number
          kegiatan_id: string | null
          kelompok_id: string
          tambahan: number | null
          tanggal: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dinilai_oleh?: string | null
          generus_id: string
          halaman: number
          id?: string
          jenis: Database["public"]["Enums"]["jenis_capaian_tilawati"]
          jilid: number
          kegiatan_id?: string | null
          kelompok_id?: string
          tambahan?: number | null
          tanggal?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dinilai_oleh?: string | null
          generus_id?: string
          halaman?: number
          id?: string
          jenis?: Database["public"]["Enums"]["jenis_capaian_tilawati"]
          jilid?: number
          kegiatan_id?: string | null
          kelompok_id?: string
          tambahan?: number | null
          tanggal?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "capaian_tilawati_dinilai_oleh_fkey"
            columns: ["dinilai_oleh"]
            isOneToOne: false
            referencedRelation: "profil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capaian_tilawati_generus_id_fkey"
            columns: ["generus_id"]
            isOneToOne: false
            referencedRelation: "generus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capaian_tilawati_kegiatan_id_fkey"
            columns: ["kegiatan_id"]
            isOneToOne: false
            referencedRelation: "kegiatan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capaian_tilawati_kelompok_id_fkey"
            columns: ["kelompok_id"]
            isOneToOne: false
            referencedRelation: "kelompok"
            referencedColumns: ["id"]
          },
        ]
      }
      catatan_raport: {
        Row: {
          bulan: string
          catatan: string
          created_at: string
          ditulis_oleh: string | null
          generus_id: string
          id: string
          kelompok_id: string
          updated_at: string
        }
        Insert: {
          bulan: string
          catatan: string
          created_at?: string
          ditulis_oleh?: string | null
          generus_id: string
          id?: string
          kelompok_id?: string
          updated_at?: string
        }
        Update: {
          bulan?: string
          catatan?: string
          created_at?: string
          ditulis_oleh?: string | null
          generus_id?: string
          id?: string
          kelompok_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "catatan_raport_ditulis_oleh_fkey"
            columns: ["ditulis_oleh"]
            isOneToOne: false
            referencedRelation: "profil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catatan_raport_generus_id_fkey"
            columns: ["generus_id"]
            isOneToOne: false
            referencedRelation: "generus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "catatan_raport_kelompok_id_fkey"
            columns: ["kelompok_id"]
            isOneToOne: false
            referencedRelation: "kelompok"
            referencedColumns: ["id"]
          },
        ]
      }
      generus: {
        Row: {
          created_at: string
          id: string
          jenis_kelamin: Database["public"]["Enums"]["jenis_kelamin"]
          kelas_id: string
          kelompok_id: string
          nama: string
          status: Database["public"]["Enums"]["status_generus"]
          tanggal_lahir: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          jenis_kelamin: Database["public"]["Enums"]["jenis_kelamin"]
          kelas_id: string
          kelompok_id?: string
          nama: string
          status?: Database["public"]["Enums"]["status_generus"]
          tanggal_lahir?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          jenis_kelamin?: Database["public"]["Enums"]["jenis_kelamin"]
          kelas_id?: string
          kelompok_id?: string
          nama?: string
          status?: Database["public"]["Enums"]["status_generus"]
          tanggal_lahir?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "generus_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generus_kelompok_id_fkey"
            columns: ["kelompok_id"]
            isOneToOne: false
            referencedRelation: "kelompok"
            referencedColumns: ["id"]
          },
        ]
      }
      generus_wali: {
        Row: {
          created_at: string
          generus_id: string
          hubungan: string | null
          id: string
          kelompok_id: string
          profil_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          generus_id: string
          hubungan?: string | null
          id?: string
          kelompok_id?: string
          profil_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          generus_id?: string
          hubungan?: string | null
          id?: string
          kelompok_id?: string
          profil_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "generus_wali_generus_id_fkey"
            columns: ["generus_id"]
            isOneToOne: false
            referencedRelation: "generus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generus_wali_kelompok_id_fkey"
            columns: ["kelompok_id"]
            isOneToOne: false
            referencedRelation: "kelompok"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generus_wali_profil_id_fkey"
            columns: ["profil_id"]
            isOneToOne: false
            referencedRelation: "profil"
            referencedColumns: ["id"]
          },
        ]
      }
      guru: {
        Row: {
          aktif: boolean
          created_at: string
          id: string
          kelompok_id: string
          nama: string
          no_hp: string | null
          profil_id: string | null
          updated_at: string
        }
        Insert: {
          aktif?: boolean
          created_at?: string
          id?: string
          kelompok_id?: string
          nama: string
          no_hp?: string | null
          profil_id?: string | null
          updated_at?: string
        }
        Update: {
          aktif?: boolean
          created_at?: string
          id?: string
          kelompok_id?: string
          nama?: string
          no_hp?: string | null
          profil_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guru_kelompok_id_fkey"
            columns: ["kelompok_id"]
            isOneToOne: false
            referencedRelation: "kelompok"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guru_profil_id_fkey"
            columns: ["profil_id"]
            isOneToOne: true
            referencedRelation: "profil"
            referencedColumns: ["id"]
          },
        ]
      }
      guru_kelas: {
        Row: {
          created_at: string
          guru_id: string
          id: string
          kelas_id: string
          kelompok_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          guru_id: string
          id?: string
          kelas_id: string
          kelompok_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          guru_id?: string
          id?: string
          kelas_id?: string
          kelompok_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guru_kelas_guru_id_fkey"
            columns: ["guru_id"]
            isOneToOne: false
            referencedRelation: "guru"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guru_kelas_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guru_kelas_kelompok_id_fkey"
            columns: ["kelompok_id"]
            isOneToOne: false
            referencedRelation: "kelompok"
            referencedColumns: ["id"]
          },
        ]
      }
      jadwal_rutin: {
        Row: {
          aktif: boolean
          created_at: string
          guru_id: string | null
          hari: number
          id: string
          jam_mulai: string
          jam_selesai: string | null
          kelompok_id: string
          updated_at: string
        }
        Insert: {
          aktif?: boolean
          created_at?: string
          guru_id?: string | null
          hari: number
          id?: string
          jam_mulai: string
          jam_selesai?: string | null
          kelompok_id?: string
          updated_at?: string
        }
        Update: {
          aktif?: boolean
          created_at?: string
          guru_id?: string | null
          hari?: number
          id?: string
          jam_mulai?: string
          jam_selesai?: string | null
          kelompok_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jadwal_rutin_guru_id_fkey"
            columns: ["guru_id"]
            isOneToOne: false
            referencedRelation: "guru"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jadwal_rutin_kelompok_id_fkey"
            columns: ["kelompok_id"]
            isOneToOne: false
            referencedRelation: "kelompok"
            referencedColumns: ["id"]
          },
        ]
      }
      jadwal_rutin_kelas: {
        Row: {
          created_at: string
          id: string
          jadwal_rutin_id: string
          kelas_id: string
          kelompok_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          jadwal_rutin_id: string
          kelas_id: string
          kelompok_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          jadwal_rutin_id?: string
          kelas_id?: string
          kelompok_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jadwal_rutin_kelas_jadwal_rutin_id_fkey"
            columns: ["jadwal_rutin_id"]
            isOneToOne: false
            referencedRelation: "jadwal_rutin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jadwal_rutin_kelas_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jadwal_rutin_kelas_kelompok_id_fkey"
            columns: ["kelompok_id"]
            isOneToOne: false
            referencedRelation: "kelompok"
            referencedColumns: ["id"]
          },
        ]
      }
      jilid_tilawati: {
        Row: {
          created_at: string
          id: string
          jilid: number
          kelompok_id: string
          total_halaman: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          jilid: number
          kelompok_id?: string
          total_halaman: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          jilid?: number
          kelompok_id?: string
          total_halaman?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jilid_tilawati_kelompok_id_fkey"
            columns: ["kelompok_id"]
            isOneToOne: false
            referencedRelation: "kelompok"
            referencedColumns: ["id"]
          },
        ]
      }
      kegiatan: {
        Row: {
          catatan: string | null
          created_at: string
          diinput_oleh: string | null
          id: string
          jadwal_rutin_id: string | null
          jam_mulai: string | null
          jam_selesai: string | null
          jenis: Database["public"]["Enums"]["jenis_kegiatan"]
          judul: string | null
          kelompok_id: string
          status: Database["public"]["Enums"]["status_kegiatan"]
          tanggal: string
          updated_at: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          diinput_oleh?: string | null
          id?: string
          jadwal_rutin_id?: string | null
          jam_mulai?: string | null
          jam_selesai?: string | null
          jenis?: Database["public"]["Enums"]["jenis_kegiatan"]
          judul?: string | null
          kelompok_id?: string
          status?: Database["public"]["Enums"]["status_kegiatan"]
          tanggal: string
          updated_at?: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          diinput_oleh?: string | null
          id?: string
          jadwal_rutin_id?: string | null
          jam_mulai?: string | null
          jam_selesai?: string | null
          jenis?: Database["public"]["Enums"]["jenis_kegiatan"]
          judul?: string | null
          kelompok_id?: string
          status?: Database["public"]["Enums"]["status_kegiatan"]
          tanggal?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kegiatan_diinput_oleh_fkey"
            columns: ["diinput_oleh"]
            isOneToOne: false
            referencedRelation: "profil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kegiatan_jadwal_rutin_id_fkey"
            columns: ["jadwal_rutin_id"]
            isOneToOne: false
            referencedRelation: "jadwal_rutin"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kegiatan_kelompok_id_fkey"
            columns: ["kelompok_id"]
            isOneToOne: false
            referencedRelation: "kelompok"
            referencedColumns: ["id"]
          },
        ]
      }
      kegiatan_kelas: {
        Row: {
          created_at: string
          id: string
          kegiatan_id: string
          kelas_id: string
          kelompok_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          kegiatan_id: string
          kelas_id: string
          kelompok_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          kegiatan_id?: string
          kelas_id?: string
          kelompok_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kegiatan_kelas_kegiatan_id_fkey"
            columns: ["kegiatan_id"]
            isOneToOne: false
            referencedRelation: "kegiatan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kegiatan_kelas_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kegiatan_kelas_kelompok_id_fkey"
            columns: ["kelompok_id"]
            isOneToOne: false
            referencedRelation: "kelompok"
            referencedColumns: ["id"]
          },
        ]
      }
      kegiatan_materi: {
        Row: {
          created_at: string
          id: string
          jenis: Database["public"]["Enums"]["jenis_materi_kitab"]
          kegiatan_id: string
          kelompok_id: string
          kitab_id: string
          mulai: number
          selesai: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          jenis?: Database["public"]["Enums"]["jenis_materi_kitab"]
          kegiatan_id: string
          kelompok_id?: string
          kitab_id: string
          mulai: number
          selesai: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          jenis?: Database["public"]["Enums"]["jenis_materi_kitab"]
          kegiatan_id?: string
          kelompok_id?: string
          kitab_id?: string
          mulai?: number
          selesai?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kegiatan_materi_kegiatan_id_fkey"
            columns: ["kegiatan_id"]
            isOneToOne: false
            referencedRelation: "kegiatan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kegiatan_materi_kelompok_id_fkey"
            columns: ["kelompok_id"]
            isOneToOne: false
            referencedRelation: "kelompok"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kegiatan_materi_kitab_id_fkey"
            columns: ["kitab_id"]
            isOneToOne: false
            referencedRelation: "kitab"
            referencedColumns: ["id"]
          },
        ]
      }
      kegiatan_pengajar: {
        Row: {
          created_at: string
          guru_id: string
          id: string
          kegiatan_id: string
          kelompok_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          guru_id: string
          id?: string
          kegiatan_id: string
          kelompok_id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          guru_id?: string
          id?: string
          kegiatan_id?: string
          kelompok_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kegiatan_pengajar_guru_id_fkey"
            columns: ["guru_id"]
            isOneToOne: false
            referencedRelation: "guru"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kegiatan_pengajar_kegiatan_id_fkey"
            columns: ["kegiatan_id"]
            isOneToOne: false
            referencedRelation: "kegiatan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kegiatan_pengajar_kelompok_id_fkey"
            columns: ["kelompok_id"]
            isOneToOne: false
            referencedRelation: "kelompok"
            referencedColumns: ["id"]
          },
        ]
      }
      kegiatan_rundown: {
        Row: {
          aktivitas: string
          created_at: string
          id: string
          kegiatan_id: string
          kelompok_id: string
          updated_at: string
          urutan: number
          waktu: string | null
        }
        Insert: {
          aktivitas: string
          created_at?: string
          id?: string
          kegiatan_id: string
          kelompok_id?: string
          updated_at?: string
          urutan: number
          waktu?: string | null
        }
        Update: {
          aktivitas?: string
          created_at?: string
          id?: string
          kegiatan_id?: string
          kelompok_id?: string
          updated_at?: string
          urutan?: number
          waktu?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kegiatan_rundown_kegiatan_id_fkey"
            columns: ["kegiatan_id"]
            isOneToOne: false
            referencedRelation: "kegiatan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kegiatan_rundown_kelompok_id_fkey"
            columns: ["kelompok_id"]
            isOneToOne: false
            referencedRelation: "kelompok"
            referencedColumns: ["id"]
          },
        ]
      }
      kelas: {
        Row: {
          aktif: boolean
          created_at: string
          id: string
          jenjang: Database["public"]["Enums"]["jenjang"]
          kelompok_id: string
          nama: string
          updated_at: string
          urutan: number
        }
        Insert: {
          aktif?: boolean
          created_at?: string
          id?: string
          jenjang: Database["public"]["Enums"]["jenjang"]
          kelompok_id?: string
          nama: string
          updated_at?: string
          urutan?: number
        }
        Update: {
          aktif?: boolean
          created_at?: string
          id?: string
          jenjang?: Database["public"]["Enums"]["jenjang"]
          kelompok_id?: string
          nama?: string
          updated_at?: string
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "kelas_kelompok_id_fkey"
            columns: ["kelompok_id"]
            isOneToOne: false
            referencedRelation: "kelompok"
            referencedColumns: ["id"]
          },
        ]
      }
      kelompok: {
        Row: {
          created_at: string
          id: string
          nama: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nama: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nama?: string
          updated_at?: string
        }
        Relationships: []
      }
      kitab: {
        Row: {
          aktif: boolean
          created_at: string
          id: string
          jenis: Database["public"]["Enums"]["jenis_kitab"]
          kelompok_id: string
          nama: string
          satuan: Database["public"]["Enums"]["satuan"]
          total_satuan: number
          updated_at: string
          urutan: number
        }
        Insert: {
          aktif?: boolean
          created_at?: string
          id?: string
          jenis: Database["public"]["Enums"]["jenis_kitab"]
          kelompok_id?: string
          nama: string
          satuan: Database["public"]["Enums"]["satuan"]
          total_satuan: number
          updated_at?: string
          urutan?: number
        }
        Update: {
          aktif?: boolean
          created_at?: string
          id?: string
          jenis?: Database["public"]["Enums"]["jenis_kitab"]
          kelompok_id?: string
          nama?: string
          satuan?: Database["public"]["Enums"]["satuan"]
          total_satuan?: number
          updated_at?: string
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "kitab_kelompok_id_fkey"
            columns: ["kelompok_id"]
            isOneToOne: false
            referencedRelation: "kelompok"
            referencedColumns: ["id"]
          },
        ]
      }
      materi_item: {
        Row: {
          aktif: boolean
          aspek: Database["public"]["Enums"]["aspek"]
          created_at: string
          id: string
          jenis_kelamin: Database["public"]["Enums"]["jenis_kelamin"] | null
          jenjang: Database["public"]["Enums"]["jenjang"] | null
          kelompok_id: string
          keterangan: string | null
          mapel: string
          nama: string
          updated_at: string
          urutan: number
        }
        Insert: {
          aktif?: boolean
          aspek: Database["public"]["Enums"]["aspek"]
          created_at?: string
          id?: string
          jenis_kelamin?: Database["public"]["Enums"]["jenis_kelamin"] | null
          jenjang?: Database["public"]["Enums"]["jenjang"] | null
          kelompok_id?: string
          keterangan?: string | null
          mapel: string
          nama: string
          updated_at?: string
          urutan?: number
        }
        Update: {
          aktif?: boolean
          aspek?: Database["public"]["Enums"]["aspek"]
          created_at?: string
          id?: string
          jenis_kelamin?: Database["public"]["Enums"]["jenis_kelamin"] | null
          jenjang?: Database["public"]["Enums"]["jenjang"] | null
          kelompok_id?: string
          keterangan?: string | null
          mapel?: string
          nama?: string
          updated_at?: string
          urutan?: number
        }
        Relationships: [
          {
            foreignKeyName: "materi_item_kelompok_id_fkey"
            columns: ["kelompok_id"]
            isOneToOne: false
            referencedRelation: "kelompok"
            referencedColumns: ["id"]
          },
        ]
      }
      pengaturan: {
        Row: {
          ambang_kehadiran: number
          created_at: string
          id: string
          kelompok_id: string
          updated_at: string
        }
        Insert: {
          ambang_kehadiran?: number
          created_at?: string
          id?: string
          kelompok_id: string
          updated_at?: string
        }
        Update: {
          ambang_kehadiran?: number
          created_at?: string
          id?: string
          kelompok_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pengaturan_kelompok_id_fkey"
            columns: ["kelompok_id"]
            isOneToOne: true
            referencedRelation: "kelompok"
            referencedColumns: ["id"]
          },
        ]
      }
      penilaian: {
        Row: {
          created_at: string
          dinilai_oleh: string | null
          generus_id: string
          id: string
          kelompok_id: string
          materi_item_id: string
          status: Database["public"]["Enums"]["status_penilaian"]
          tanggal: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          dinilai_oleh?: string | null
          generus_id: string
          id?: string
          kelompok_id?: string
          materi_item_id: string
          status: Database["public"]["Enums"]["status_penilaian"]
          tanggal?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          dinilai_oleh?: string | null
          generus_id?: string
          id?: string
          kelompok_id?: string
          materi_item_id?: string
          status?: Database["public"]["Enums"]["status_penilaian"]
          tanggal?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "penilaian_dinilai_oleh_fkey"
            columns: ["dinilai_oleh"]
            isOneToOne: false
            referencedRelation: "profil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penilaian_generus_id_fkey"
            columns: ["generus_id"]
            isOneToOne: false
            referencedRelation: "generus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penilaian_kelompok_id_fkey"
            columns: ["kelompok_id"]
            isOneToOne: false
            referencedRelation: "kelompok"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "penilaian_materi_item_id_fkey"
            columns: ["materi_item_id"]
            isOneToOne: false
            referencedRelation: "materi_item"
            referencedColumns: ["id"]
          },
        ]
      }
      presensi: {
        Row: {
          created_at: string
          diubah_oleh: string | null
          generus_id: string
          id: string
          kegiatan_id: string
          kelompok_id: string
          keterangan: string | null
          status: Database["public"]["Enums"]["status_presensi"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          diubah_oleh?: string | null
          generus_id: string
          id?: string
          kegiatan_id: string
          kelompok_id?: string
          keterangan?: string | null
          status: Database["public"]["Enums"]["status_presensi"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          diubah_oleh?: string | null
          generus_id?: string
          id?: string
          kegiatan_id?: string
          kelompok_id?: string
          keterangan?: string | null
          status?: Database["public"]["Enums"]["status_presensi"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "presensi_diubah_oleh_fkey"
            columns: ["diubah_oleh"]
            isOneToOne: false
            referencedRelation: "profil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presensi_generus_id_fkey"
            columns: ["generus_id"]
            isOneToOne: false
            referencedRelation: "generus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presensi_kegiatan_id_fkey"
            columns: ["kegiatan_id"]
            isOneToOne: false
            referencedRelation: "kegiatan"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presensi_kelompok_id_fkey"
            columns: ["kelompok_id"]
            isOneToOne: false
            referencedRelation: "kelompok"
            referencedColumns: ["id"]
          },
        ]
      }
      profil: {
        Row: {
          created_at: string
          id: string
          kelompok_id: string
          nama: string
          no_hp: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          kelompok_id: string
          nama: string
          no_hp: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          kelompok_id?: string
          nama?: string
          no_hp?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profil_kelompok_id_fkey"
            columns: ["kelompok_id"]
            isOneToOne: false
            referencedRelation: "kelompok"
            referencedColumns: ["id"]
          },
        ]
      }
      profil_peran: {
        Row: {
          created_at: string
          id: string
          kelompok_id: string
          peran: Database["public"]["Enums"]["peran"]
          profil_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          kelompok_id?: string
          peran: Database["public"]["Enums"]["peran"]
          profil_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          kelompok_id?: string
          peran?: Database["public"]["Enums"]["peran"]
          profil_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profil_peran_kelompok_id_fkey"
            columns: ["kelompok_id"]
            isOneToOne: false
            referencedRelation: "kelompok"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profil_peran_profil_id_fkey"
            columns: ["profil_id"]
            isOneToOne: false
            referencedRelation: "profil"
            referencedColumns: ["id"]
          },
        ]
      }
      quran_surat: {
        Row: {
          ayat_awal: number
          jumlah_ayat: number
          nama_arab: string
          nama_latin: string
          nomor: number
        }
        Insert: {
          ayat_awal: number
          jumlah_ayat: number
          nama_arab: string
          nama_latin: string
          nomor: number
        }
        Update: {
          ayat_awal?: number
          jumlah_ayat?: number
          nama_arab?: string
          nama_latin?: string
          nomor?: number
        }
        Relationships: []
      }
      riwayat_kelas: {
        Row: {
          created_at: string
          generus_id: string
          id: string
          kelas_id: string
          kelompok_id: string
          mulai: string
          selesai: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          generus_id: string
          id?: string
          kelas_id: string
          kelompok_id: string
          mulai: string
          selesai?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          generus_id?: string
          id?: string
          kelas_id?: string
          kelompok_id?: string
          mulai?: string
          selesai?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "riwayat_kelas_generus_id_fkey"
            columns: ["generus_id"]
            isOneToOne: false
            referencedRelation: "generus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "riwayat_kelas_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "riwayat_kelas_kelompok_id_fkey"
            columns: ["kelompok_id"]
            isOneToOne: false
            referencedRelation: "kelompok"
            referencedColumns: ["id"]
          },
        ]
      }
      susulan: {
        Row: {
          created_at: string
          generus_id: string
          guru_id: string | null
          id: string
          jenis: Database["public"]["Enums"]["jenis_materi_kitab"]
          kelompok_id: string
          kitab_id: string
          mulai: number
          selesai: number
          tanggal: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          generus_id: string
          guru_id?: string | null
          id?: string
          jenis?: Database["public"]["Enums"]["jenis_materi_kitab"]
          kelompok_id?: string
          kitab_id: string
          mulai: number
          selesai: number
          tanggal?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          generus_id?: string
          guru_id?: string | null
          id?: string
          jenis?: Database["public"]["Enums"]["jenis_materi_kitab"]
          kelompok_id?: string
          kitab_id?: string
          mulai?: number
          selesai?: number
          tanggal?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "susulan_generus_id_fkey"
            columns: ["generus_id"]
            isOneToOne: false
            referencedRelation: "generus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "susulan_guru_id_fkey"
            columns: ["guru_id"]
            isOneToOne: false
            referencedRelation: "guru"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "susulan_kelompok_id_fkey"
            columns: ["kelompok_id"]
            isOneToOne: false
            referencedRelation: "kelompok"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "susulan_kitab_id_fkey"
            columns: ["kitab_id"]
            isOneToOne: false
            referencedRelation: "kitab"
            referencedColumns: ["id"]
          },
        ]
      }
      target_bulanan: {
        Row: {
          catatan: string | null
          created_at: string
          dibuat_oleh: string | null
          id: string
          judul: string
          kelompok_id: string
          mulai: string
          selesai: string
          semester: string | null
          updated_at: string
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          dibuat_oleh?: string | null
          id?: string
          judul: string
          kelompok_id?: string
          mulai: string
          selesai: string
          semester?: string | null
          updated_at?: string
        }
        Update: {
          catatan?: string | null
          created_at?: string
          dibuat_oleh?: string | null
          id?: string
          judul?: string
          kelompok_id?: string
          mulai?: string
          selesai?: string
          semester?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "target_bulanan_dibuat_oleh_fkey"
            columns: ["dibuat_oleh"]
            isOneToOne: false
            referencedRelation: "profil"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "target_bulanan_kelompok_id_fkey"
            columns: ["kelompok_id"]
            isOneToOne: false
            referencedRelation: "kelompok"
            referencedColumns: ["id"]
          },
        ]
      }
      target_bulanan_kelas: {
        Row: {
          created_at: string
          id: string
          kelas_id: string
          kelompok_id: string
          target_bulanan_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          kelas_id: string
          kelompok_id?: string
          target_bulanan_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          kelas_id?: string
          kelompok_id?: string
          target_bulanan_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "target_bulanan_kelas_kelas_id_fkey"
            columns: ["kelas_id"]
            isOneToOne: false
            referencedRelation: "kelas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "target_bulanan_kelas_kelompok_id_fkey"
            columns: ["kelompok_id"]
            isOneToOne: false
            referencedRelation: "kelompok"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "target_bulanan_kelas_target_bulanan_id_fkey"
            columns: ["target_bulanan_id"]
            isOneToOne: false
            referencedRelation: "target_bulanan"
            referencedColumns: ["id"]
          },
        ]
      }
      target_kitab: {
        Row: {
          created_at: string
          id: string
          jenis: Database["public"]["Enums"]["jenis_materi_kitab"]
          kelompok_id: string
          kitab_id: string
          mulai: number
          selesai: number
          target_bulanan_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          jenis?: Database["public"]["Enums"]["jenis_materi_kitab"]
          kelompok_id?: string
          kitab_id: string
          mulai: number
          selesai: number
          target_bulanan_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          jenis?: Database["public"]["Enums"]["jenis_materi_kitab"]
          kelompok_id?: string
          kitab_id?: string
          mulai?: number
          selesai?: number
          target_bulanan_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "target_makna_kelompok_id_fkey"
            columns: ["kelompok_id"]
            isOneToOne: false
            referencedRelation: "kelompok"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "target_makna_kitab_id_fkey"
            columns: ["kitab_id"]
            isOneToOne: false
            referencedRelation: "kitab"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "target_makna_target_bulanan_id_fkey"
            columns: ["target_bulanan_id"]
            isOneToOne: false
            referencedRelation: "target_bulanan"
            referencedColumns: ["id"]
          },
        ]
      }
      target_materi: {
        Row: {
          created_at: string
          id: string
          kelompok_id: string
          materi_item_id: string
          target_bulanan_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          kelompok_id?: string
          materi_item_id: string
          target_bulanan_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          kelompok_id?: string
          materi_item_id?: string
          target_bulanan_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "target_materi_kelompok_id_fkey"
            columns: ["kelompok_id"]
            isOneToOne: false
            referencedRelation: "kelompok"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "target_materi_materi_item_id_fkey"
            columns: ["materi_item_id"]
            isOneToOne: false
            referencedRelation: "materi_item"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "target_materi_target_bulanan_id_fkey"
            columns: ["target_bulanan_id"]
            isOneToOne: false
            referencedRelation: "target_bulanan"
            referencedColumns: ["id"]
          },
        ]
      }
      target_tilawati: {
        Row: {
          created_at: string
          halaman: number
          id: string
          jilid: number
          kelompok_id: string
          target_bulanan_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          halaman: number
          id?: string
          jilid: number
          kelompok_id?: string
          target_bulanan_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          halaman?: number
          id?: string
          jilid?: number
          kelompok_id?: string
          target_bulanan_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "target_tilawati_kelompok_id_fkey"
            columns: ["kelompok_id"]
            isOneToOne: false
            referencedRelation: "kelompok"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "target_tilawati_target_bulanan_id_fkey"
            columns: ["target_bulanan_id"]
            isOneToOne: true
            referencedRelation: "target_bulanan"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      boleh_kelola_kegiatan: {
        Args: { p_kegiatan_id: string }
        Returns: boolean
      }
      boleh_kelola_target: { Args: { p_target_id: string }; Returns: boolean }
      boleh_lihat_generus: { Args: { p_generus_id: string }; Returns: boolean }
      boleh_lihat_kegiatan: {
        Args: { p_kegiatan_id: string }
        Returns: boolean
      }
      cek_target_tumpang_tindih: {
        Args: { p_target_id: string }
        Returns: undefined
      }
      fn_ayat_global: {
        Args: { p_ayat: number; p_surat: number }
        Returns: number
      }
      fn_format_rentang: {
        Args: { p_kitab_id: string; p_mulai: number; p_selesai: number }
        Returns: string
      }
      fn_surat_ayat: {
        Args: { p_global: number }
        Returns: Record<string, unknown>
      }
      guru_mengajar_generus: {
        Args: { p_generus_id: string }
        Returns: boolean
      }
      guru_mengajar_kegiatan: {
        Args: { p_kegiatan_id: string }
        Returns: boolean
      }
      guru_mengajar_kelas: { Args: { p_kelas_id: string }; Returns: boolean }
      guru_mengajar_target: { Args: { p_target_id: string }; Returns: boolean }
      hari_ini: { Args: never; Returns: string }
      kelompok_saya: { Args: never; Returns: string }
      punya_peran: {
        Args: { p: Database["public"]["Enums"]["peran"] }
        Returns: boolean
      }
      siapkan_kegiatan: { Args: { p_tanggal: string }; Returns: number }
      wali_dari: { Args: { p_generus_id: string }; Returns: boolean }
    }
    Enums: {
      aspek: "alim" | "faqih" | "akhlaqul_karimah" | "mandiri"
      jenis_capaian_tilawati: "tambah" | "koreksi" | "naik_jilid"
      jenis_kegiatan: "rutin" | "khusus"
      jenis_kelamin: "laki_laki" | "perempuan"
      jenis_kitab: "quran" | "hadist"
      jenis_materi_kitab: "makna" | "bacaan"
      jenjang: "caberawit" | "pra_remaja" | "remaja"
      peran: "admin" | "guru" | "pengurus" | "wali"
      satuan: "halaman" | "ayat"
      status_generus: "aktif" | "lulus" | "pindah" | "nonaktif"
      status_kegiatan: "terjadwal" | "selesai" | "batal"
      status_penilaian: "belum" | "proses" | "lancar"
      status_presensi: "hadir" | "terlambat" | "izin" | "sakit" | "alpa"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      aspek: ["alim", "faqih", "akhlaqul_karimah", "mandiri"],
      jenis_capaian_tilawati: ["tambah", "koreksi", "naik_jilid"],
      jenis_kegiatan: ["rutin", "khusus"],
      jenis_kelamin: ["laki_laki", "perempuan"],
      jenis_kitab: ["quran", "hadist"],
      jenis_materi_kitab: ["makna", "bacaan"],
      jenjang: ["caberawit", "pra_remaja", "remaja"],
      peran: ["admin", "guru", "pengurus", "wali"],
      satuan: ["halaman", "ayat"],
      status_generus: ["aktif", "lulus", "pindah", "nonaktif"],
      status_kegiatan: ["terjadwal", "selesai", "batal"],
      status_penilaian: ["belum", "proses", "lancar"],
      status_presensi: ["hadir", "terlambat", "izin", "sakit", "alpa"],
    },
  },
} as const
