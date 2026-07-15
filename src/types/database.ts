export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Catatan: Nama tabel sementara diset "permohonan", 
      // bisa disesuaikan dengan nama asli di Supabase Anda jika berbeda.
      users: {
        Row: {
          id: number
          name: string
          password?: string
          created_at?: string | null
        }
        Insert: { [key: string]: any }
        Update: { [key: string]: any }
      }
      tim_penilais: {
        Row: {
          id: number
          nama: string
          nip: string | null
          pangkat_golongan: string | null
          jabatan_dinas: string | null
          kategori: string | null
          urutan_hierarki: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: { [key: string]: any }
        Update: { [key: string]: any }
      }
      dokumens: {
        Row: {
          id: number
          no_urut: number | null
          tahun: string | null
          nomor_checklist: string | null
          nama_pemrakarsa: string | null
          nama_kegiatan: string | null
          jenis_dokumen: string | null
          tanggal_masuk_dokumen: string | null
          sumber_data: string | null
          telepon_pemrakarsa: string | null
          nama_konsultan: string | null
          telepon_konsultan: string | null
          pengirim_sebagai: string | null
          nama_pengirim: string | null
          nama_petugas: string | null
          keterangan: string | null
          status_tahapan: string | null
          nomor_uji_berkas: string | null
          tanggal_uji_berkas: string | null
          nomor_ba_verlap: string | null
          tanggal_verlap: string | null
          seq_verlap: number | null
          nomor_ba_pemeriksaan: string | null
          tanggal_pemeriksaan: string | null
          seq_pemeriksaan: number | null
          nomor_revisi_1: string | null
          tanggal_revisi_1: string | null
          nomor_revisi_2: string | null
          tanggal_revisi_2: string | null
          nomor_revisi_3: string | null
          tanggal_revisi_3: string | null
          nomor_revisi_4: string | null
          tanggal_revisi_4: string | null
          nomor_revisi_5: string | null
          tanggal_revisi_5: string | null
          nomor_php: string | null
          nomor_php1: string | null
          nomor_php2: string | null
          nomor_php3: string | null
          nomor_php4: string | null
          nomor_php5: string | null
          tanggal_php_1: string | null
          tanggal_php_2: string | null
          tanggal_php_3: string | null
          tanggal_php_4: string | null
          tanggal_php_5: string | null
          nomor_risalah: string | null
          tanggal_risalah: string | null
          seq_risalah: number | null
          tahun_risalah: number | null
          tanggal_pengembalian: string | null
          keterangan_pengembalian: string | null
          arsip_fisik: string | null
          file_checklist_url: string | null
          file_tanda_terima_url: string | null
          file_ba_word_url: string | null
          file_php_url: string | null
          created_at: string | null
          updated_at: string | null
          file_registrasi_url: string | null
          file_uji_admin_url: string | null
          file_verlap_url: string | null
          file_ba_substansi_url: string | null
          file_php1_url: string | null
          file_php2_url: string | null
          file_php3_url: string | null
          file_php4_url: string | null
          file_php5_url: string | null
          file_penerimaan_url: string | null
          file_arsip_url: string | null
          file_pengembalian_url: string | null
          petugas_mpp_id: number | null
          checklist_status: Json | null
          checklist_notes: Json | null
          penandatangan_uji_admin: Json | null
          penandatangan_hua: Json | null
          penandatangan_verlap: Json | null
          penandatangan_pemeriksaan: Json | null
          penandatangan_revisi: Json | null
          lokasi_kegiatan: string | null
          jenis_kegiatan: string | null
          ekstra_baris: number | null
          besaran_luasan: string | null
          satuan_luasan: string | null
          nomor_registrasi_amdalnet: string | null
          nomor_surat_permohonan: string | null
          tanggal_surat_permohonan: string | null
          perihal_surat_permohonan: string | null
          revisi_ke: string | null
          status_verifikasi: string | null
        }
        Insert: { [key: string]: any }
        Update: { [key: string]: any }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
