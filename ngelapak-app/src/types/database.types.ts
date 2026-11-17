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
      bookings: {
        Row: {
          bukti_bayar: string | null
          catatan: string | null
          created_at: string
          id: string
          jenis_usaha: string | null
          jumlah_hari: number | null
          kategori_penjual: string | null
          metode_pembayaran: string | null
          midtrans_checkout_url: string | null
          midtrans_status: string | null
          midtrans_transaction_id: string | null
          nama_usaha: string | null
          owner_id: string | null
          payment_deadline: string | null
          payment_expires_at: string | null
          penyewa_avatar: string | null
          penyewa_email: string | null
          penyewa_fakultas: string | null
          penyewa_nama: string | null
          penyewa_nim: string | null
          penyewa_telepon: string | null
          spot_id: string | null
          spot_kode: string | null
          spot_nama: string | null
          status: string
          status_verifikasi: string
          tanggal_mulai: string
          tanggal_selesai: string
          total_bayar: number | null
          verified_at: string | null
        }
        Insert: {
          bukti_bayar?: string | null
          catatan?: string | null
          created_at?: string
          id?: string
          jenis_usaha?: string | null
          jumlah_hari?: number | null
          kategori_penjual?: string | null
          metode_pembayaran?: string | null
          midtrans_checkout_url?: string | null
          midtrans_status?: string | null
          midtrans_transaction_id?: string | null
          nama_usaha?: string | null
          owner_id?: string | null
          payment_deadline?: string | null
          payment_expires_at?: string | null
          penyewa_avatar?: string | null
          penyewa_email?: string | null
          penyewa_fakultas?: string | null
          penyewa_nama?: string | null
          penyewa_nim?: string | null
          penyewa_telepon?: string | null
          spot_id?: string | null
          spot_kode?: string | null
          spot_nama?: string | null
          status?: string
          status_verifikasi?: string
          tanggal_mulai: string
          tanggal_selesai: string
          total_bayar?: number | null
          verified_at?: string | null
        }
        Update: {
          bukti_bayar?: string | null
          catatan?: string | null
          created_at?: string
          id?: string
          jenis_usaha?: string | null
          jumlah_hari?: number | null
          kategori_penjual?: string | null
          metode_pembayaran?: string | null
          midtrans_checkout_url?: string | null
          midtrans_status?: string | null
          midtrans_transaction_id?: string | null
          nama_usaha?: string | null
          owner_id?: string | null
          payment_deadline?: string | null
          payment_expires_at?: string | null
          penyewa_avatar?: string | null
          penyewa_email?: string | null
          penyewa_fakultas?: string | null
          penyewa_nama?: string | null
          penyewa_nim?: string | null
          penyewa_telepon?: string | null
          spot_id?: string | null
          spot_kode?: string | null
          spot_nama?: string | null
          status?: string
          status_verifikasi?: string
          tanggal_mulai?: string
          tanggal_selesai?: string
          total_bayar?: number | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "spots"
            referencedColumns: ["id"]
          },
        ]
      }
      cancellations: {
        Row: {
          admin_catatan: string | null
          alasan: string | null
          bank: string | null
          booking_id: string
          bukti_refund: string | null
          diajukan_pada: string
          id: string
          nama: string | null
          nama_rekening: string | null
          nim: string | null
          nomor_rekening: string | null
          resolved_at: string | null
          status: string
          telepon: string | null
        }
        Insert: {
          admin_catatan?: string | null
          alasan?: string | null
          bank?: string | null
          booking_id: string
          bukti_refund?: string | null
          diajukan_pada?: string
          id?: string
          nama?: string | null
          nama_rekening?: string | null
          nim?: string | null
          nomor_rekening?: string | null
          resolved_at?: string | null
          status?: string
          telepon?: string | null
        }
        Update: {
          admin_catatan?: string | null
          alasan?: string | null
          bank?: string | null
          booking_id?: string
          bukti_refund?: string | null
          diajukan_pada?: string
          id?: string
          nama?: string | null
          nama_rekening?: string | null
          nim?: string | null
          nomor_rekening?: string | null
          resolved_at?: string | null
          status?: string
          telepon?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cancellations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          booking_id: string
          bukti_url: string | null
          created_at: string
          id: string
          metode: string | null
          nominal: number | null
          status: string
        }
        Insert: {
          booking_id: string
          bukti_url?: string | null
          created_at?: string
          id?: string
          metode?: string | null
          nominal?: number | null
          status?: string
        }
        Update: {
          booking_id?: string
          bukti_url?: string | null
          created_at?: string
          id?: string
          metode?: string | null
          nominal?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      product_captions: {
        Row: {
          id: string
          konten: string | null
          owner_id: string
          spot_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          konten?: string | null
          owner_id: string
          spot_id: string
          updated_at?: string
        }
        Update: {
          id?: string
          konten?: string | null
          owner_id?: string
          spot_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_captions_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_captions_spot_id_fkey"
            columns: ["spot_id"]
            isOneToOne: false
            referencedRelation: "spots"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          fakultas: string | null
          id: string
          nama: string
          nim: string | null
          role: string
          telepon: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          fakultas?: string | null
          id: string
          nama: string
          nim?: string | null
          role?: string
          telepon?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          fakultas?: string | null
          id?: string
          nama?: string
          nim?: string | null
          role?: string
          telepon?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      spots: {
        Row: {
          created_at: string
          daya: number | null
          deskripsi: string | null
          fasilitas: string[] | null
          gambar: string | null
          id: string
          jenis_usaha: string | null
          kode: string
          koordinat_x: number | null
          koordinat_y: number | null
          lokasi: string | null
          nama: string
          rating: number | null
          status: string
          tags: string[] | null
          tarif_per_hari: number
          total_sewa: number
          ukuran: string
          ukuran_label: string | null
          updated_at: string
          zona: string
          zona_label: string | null
        }
        Insert: {
          created_at?: string
          daya?: number | null
          deskripsi?: string | null
          fasilitas?: string[] | null
          gambar?: string | null
          id?: string
          jenis_usaha?: string | null
          kode: string
          koordinat_x?: number | null
          koordinat_y?: number | null
          lokasi?: string | null
          nama: string
          rating?: number | null
          status?: string
          tags?: string[] | null
          tarif_per_hari: number
          total_sewa?: number
          ukuran: string
          ukuran_label?: string | null
          updated_at?: string
          zona: string
          zona_label?: string | null
        }
        Update: {
          created_at?: string
          daya?: number | null
          deskripsi?: string | null
          fasilitas?: string[] | null
          gambar?: string | null
          id?: string
          jenis_usaha?: string | null
          kode?: string
          koordinat_x?: number | null
          koordinat_y?: number | null
          lokasi?: string | null
          nama?: string
          rating?: number | null
          status?: string
          tags?: string[] | null
          tarif_per_hari?: number
          total_sewa?: number
          ukuran?: string
          ukuran_label?: string | null
          updated_at?: string
          zona?: string
          zona_label?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_midtrans_status: {
        Args: {
          p_amount: number
          p_booking_id: string
          p_paid_at: string
          p_status: string
          p_transaction_id: string
        }
        Returns: boolean
      }
      cancel_booking_as_tenant: {
        Args: {
          p_alasan: string
          p_bank: string
          p_booking_id: string
          p_nama: string
          p_nama_rekening: string
          p_nim: string
          p_nomor_rekening: string
          p_telepon: string
        }
        Returns: Json
      }
      create_booking_with_payment: {
        Args: {
          p_bukti_bayar?: string
          p_catatan: string
          p_jenis_usaha: string
          p_jumlah_hari: number
          p_kategori_penjual: string
          p_metode_pembayaran: string
          p_nama_usaha: string
          p_spot_kode: string
          p_tanggal_mulai: string
          p_total_bayar: number
        }
        Returns: string
      }
      generate_booking_id: { Args: never; Returns: string }
      get_public_home_stats: { Args: never; Returns: number }
      get_public_operational_schedule: {
        Args: { p_end: string; p_start: string }
        Returns: {
          booking_id: string
          jenis_usaha: string
          nama_usaha: string
          spot_id: string
          tanggal_mulai: string
          tanggal_selesai: string
        }[]
      }
      get_spot_operating_schedule: {
        Args: { p_spot_id: string }
        Returns: {
          booking_id: string
          kategori: string
          penjual: string
          tanggal_mulai: string
          tanggal_selesai: string
        }[]
      }
      get_ticket_validation: {
        Args: { p_ticket_id: string }
        Returns: {
          id: string
          jenis_usaha: string
          nama_penyewa: string
          nim: string
          spot_kode: string
          spot_nama: string
          status: string
          status_verifikasi: string
          tanggal_mulai: string
          tanggal_selesai: string
        }[]
      }
      get_unavailable_lapak_ids: {
        Args: { p_end: string; p_start: string }
        Returns: {
          spot_id: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      reserve_midtrans_booking: {
        Args: {
          p_booking_id: string
          p_catatan: string
          p_jenis_usaha: string
          p_jumlah_hari: number
          p_kategori_penjual: string
          p_nama_usaha: string
          p_owner: string
          p_spot_kode: string
          p_tanggal_mulai: string
          p_total_bayar: number
        }
        Returns: Json
      }
      validate_booking_ticket: {
        Args: { p_ticket_id: string }
        Returns: {
          id: string
          jenis_usaha: string
          penyewa_fakultas: string
          penyewa_nama: string
          penyewa_nim: string
          spot_kode: string
          spot_nama: string
          status: string
          status_verifikasi: string
          tanggal_mulai: string
          tanggal_selesai: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
