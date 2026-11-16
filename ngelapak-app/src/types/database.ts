// Public schema from Supabase migrations. Update when the schema changes.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row, Required extends keyof Row, Generated extends keyof Row = never, Relationships extends unknown[] = []> = {
  Row: Row;
  Insert: Pick<Row, Required> & Partial<Omit<Row, Required | Generated>>;
  Update: Partial<Omit<Row, Generated>>;
  Relationships: Relationships;
};

type bookings = {
  id: string;
  owner_id: string | null;
  spot_id: string | null;
  spot_nama: string | null;
  spot_kode: string | null;
  penyewa_nama: string | null;
  penyewa_nim: string | null;
  penyewa_fakultas: string | null;
  penyewa_telepon: string | null;
  penyewa_email: string | null;
  penyewa_avatar: string | null;
  tanggal_mulai: string;
  tanggal_selesai: string;
  jumlah_hari: number | null;
  total_bayar: number | null;
  metode_pembayaran: string | null;
  bukti_bayar: string | null;
  status: string;
  status_verifikasi: string;
  catatan: string | null;
  jenis_usaha: string | null;
  created_at: string;
  nama_usaha: string | null;
  kategori_penjual: string | null;
  verified_at: string | null;
  payment_expires_at: string | null;
  midtrans_checkout_url: string | null;
  midtrans_status: string | null;
  midtrans_transaction_id: string | null;
};

type cancellations = {
  id: string;
  booking_id: string;
  nama: string | null;
  nim: string | null;
  telepon: string | null;
  bank: string | null;
  nomor_rekening: string | null;
  nama_rekening: string | null;
  alasan: string | null;
  diajukan_pada: string;
  status: string;
  admin_catatan: string | null;
  bukti_refund: string | null;
  resolved_at: string | null;
};

type payments = {
  id: string;
  booking_id: string;
  bukti_url: string | null;
  nominal: number | null;
  metode: string | null;
  status: string;
  created_at: string;
};

type product_captions = {
  id: string;
  spot_id: string;
  owner_id: string;
  konten: string | null;
  updated_at: string;
};

type profiles = {
  id: string;
  nama: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
  nim: string | null;
  fakultas: string | null;
  telepon: string | null;
};

type spots = {
  id: string;
  kode: string;
  nama: string;
  zona: "rektorat" | "boulevard" | "sc" | "agrokompleks";
  zona_label: string | null;
  lokasi: string | null;
  ukuran: "2x2" | "3x3" | "4x4";
  ukuran_label: string | null;
  daya: number | null;
  tarif_per_hari: number;
  status: string;
  fasilitas: string[] | null;
  tags: string[] | null;
  koordinat_x: number | null;
  koordinat_y: number | null;
  gambar: string | null;
  rating: number | null;
  total_sewa: number;
  deskripsi: string | null;
  jenis_usaha: string | null;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      bookings: Table<bookings, "tanggal_mulai" | "tanggal_selesai", "jumlah_hari", [
        { foreignKeyName: "bookings_owner_id_fkey"; columns: ["owner_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"]; },
        { foreignKeyName: "bookings_spot_id_fkey"; columns: ["spot_id"]; isOneToOne: false; referencedRelation: "spots"; referencedColumns: ["id"]; },
      ]>;
      cancellations: Table<cancellations, "booking_id", never, [
        { foreignKeyName: "cancellations_booking_id_fkey"; columns: ["booking_id"]; isOneToOne: false; referencedRelation: "bookings"; referencedColumns: ["id"]; },
      ]>;
      payments: Table<payments, "booking_id", never, [
        { foreignKeyName: "payments_booking_id_fkey"; columns: ["booking_id"]; isOneToOne: false; referencedRelation: "bookings"; referencedColumns: ["id"]; },
      ]>;
      product_captions: Table<product_captions, "spot_id" | "owner_id", never, [
        { foreignKeyName: "product_captions_spot_id_fkey"; columns: ["spot_id"]; isOneToOne: false; referencedRelation: "spots"; referencedColumns: ["id"]; },
        { foreignKeyName: "product_captions_owner_id_fkey"; columns: ["owner_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"]; },
      ]>;
      profiles: Table<profiles, "id" | "nama" | "email">;
      spots: Table<spots, "kode" | "nama" | "zona" | "ukuran" | "tarif_per_hari">;
    };
    Views: Record<never, never>;
    Functions: {
      is_admin: { Args: Record<never, never>; Returns: boolean };

      get_public_home_stats: {
        Args: Record<never, never>;
        Returns: number;
      };

      get_admin_rental_metrics: {
        Args: Record<never, never>;
        Returns: Json;
      };

      get_unavailable_lapak_ids: {
        Args: { p_start: string; p_end: string };
        Returns: { spot_id: string }[];
      };

      get_public_operational_schedule: {
        Args: {
          p_start: string;
          p_end: string;
        };
        Returns: {
          booking_id: string;
          spot_id: string;
          nama_usaha: string | null;
          jenis_usaha: string | null;
          tanggal_mulai: string;
          tanggal_selesai: string;
        }[];
      };

      get_reserved_lapak_dates: {
        Args: { p_spot_id: string };
        Returns: { tanggal_mulai: string; tanggal_selesai: string }[];
      };
      get_spot_operating_schedule: {
        Args: { p_spot_id: string };
        Returns: {
          booking_id: string;
          penjual: string;
          kategori: string;
          tanggal_mulai: string;
          tanggal_selesai: string;
        }[];
      };
      review_booking_payment: { Args: { p_booking_id: string; p_approve: boolean }; Returns: undefined };
      reserve_midtrans_booking: {
        Args: {
          p_booking_id: string; p_owner: string; p_spot_kode: string; p_tanggal_mulai: string;
          p_jumlah_hari: number; p_total_bayar: number; p_jenis_usaha: string;
          p_nama_usaha: string; p_kategori_penjual: string; p_catatan: string;
        };
        Returns: bookings;
      };
      apply_midtrans_status: {
        Args: { p_booking_id: string; p_amount: number; p_transaction_id: string | null; p_status: string; p_paid_at: string | null };
        Returns: boolean;
      };
      review_booking_cancellation: {
        Args: { p_cancellation_id: string; p_approve: boolean; p_proof: string | null; p_note: string | null };
        Returns: undefined;
      };
      record_booking_refund: {
        Args: { p_cancellation_id: string; p_proof: string };
        Returns: undefined;
      };
      submit_booking_with_payment: {
        Args: {
          p_spot_kode: string;
          p_tanggal_mulai: string;
          p_jumlah_hari: number;
          p_total_bayar: number;
          p_metode_pembayaran: string;
          p_jenis_usaha: string;
          p_nama_usaha: string;
          p_kategori_penjual: string;
          p_catatan: string;
          p_bukti_bayar: string;
        };
        Returns: string;
      };
      cancel_booking_as_tenant: {
        Args: {
          p_booking_id: string;
          p_nama: string;
          p_nim: string;
          p_telepon: string;
          p_bank: string;
          p_nomor_rekening: string;
          p_nama_rekening: string;
          p_alasan: string;
        };
        Returns: Json;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
