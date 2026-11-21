import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";

const bodySchema = z.object({
  bookingId: z.string().min(1).max(80),
  nama: z.string().trim().min(1).max(120),
  nim: z.string().trim().min(1).max(40),
  telepon: z.string().trim().min(1).max(30),
  bank: z.string().trim().min(1).max(60),
  nomorRekening: z.string().regex(/^[0-9]{5,30}$/),
  namaRekening: z.string().trim().min(1).max(120),
  alasan: z.string().trim().min(1).max(1000),
});

function cancellationCutoff(tanggalMulai: string, verifiedAt: string) {
  const paid = Date.parse(verifiedAt);
  const rentalStart = Date.parse(`${tanggalMulai}T08:00:00+08:00`);
  const day = 24 * 60 * 60 * 1000;
  return Math.min(paid + day, rentalStart - day);
}

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json(
      { error: "Lengkapi identitas, alasan, dan nomor rekening yang valid." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: "Silakan masuk kembali sebelum membatalkan pesanan." }, { status: 401 });
  }

  const input = parsed.data;
  const db = createServiceRoleClient();
  const { data: booking, error: bookingError } = await db
    .from("bookings")
    .select(
      "id,owner_id,status,status_verifikasi,verified_at,created_at,tanggal_mulai,metode_pembayaran",
    )
    .eq("id", input.bookingId)
    .maybeSingle();

  if (bookingError || !booking || booking.owner_id !== user.id) {
    return Response.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
  }

  const { data: existing, error: existingError } = await db
    .from("cancellations")
    .select("id,status")
    .eq("booking_id", booking.id)
    .neq("status", "ditolak")
    .limit(1)
    .maybeSingle();

  if (existingError) {
    return Response.json({ error: "Status pembatalan gagal diperiksa." }, { status: 503 });
  }
  if (existing) {
    return Response.json({ error: "Pengajuan pembatalan sudah tercatat." }, { status: 409 });
  }

  const now = Date.now();
  const isVerifiedPaid =
    booking.status === "aktif" &&
    booking.status_verifikasi === "disetujui" &&
    Boolean(booking.verified_at);

  const isPreVerify =
    booking.status === "menunggu" && booking.status_verifikasi === "menunggu";

  if (isVerifiedPaid && booking.verified_at) {
    const cutoff = cancellationCutoff(booking.tanggal_mulai, booking.verified_at);
    if (
      !Number.isFinite(cutoff) ||
      Date.parse(booking.verified_at) >= cutoff ||
      now > cutoff
    ) {
      return Response.json(
        { error: "Batas pengajuan pembatalan sudah lewat atau pesanan belum lunas." },
        { status: 400 },
      );
    }
  } else if (isPreVerify) {
    const created = Date.parse(booking.created_at);
    if (!Number.isFinite(created) || now - created > 24 * 60 * 60 * 1000) {
      return Response.json(
        { error: "Batas waktu pembatalan mandiri (1×24 jam) telah habis." },
        { status: 400 },
      );
    }
  } else {
    return Response.json(
      { error: "Pesanan ini tidak dapat diajukan pembatalannya saat ini." },
      { status: 400 },
    );
  }

  const { error: insertError } = await db.from("cancellations").insert({
    booking_id: booking.id,
    nama: input.nama,
    nim: input.nim,
    telepon: input.telepon,
    bank: input.bank,
    nomor_rekening: input.nomorRekening,
    nama_rekening: input.namaRekening,
    alasan: input.alasan,
    status: "menunggu",
  });

  if (insertError) {
    return Response.json(
      { error: insertError.message || "Pengajuan pembatalan gagal disimpan." },
      { status: 503 },
    );
  }

  // Legacy pre-verify: free the schedule immediately. Paid/verified Midtrans keeps
  // the slot held until admin approves the refund request.
  if (isPreVerify) {
    await db.from("bookings").update({ status: "dibatalkan" }).eq("id", booking.id);
  }

  return Response.json({
    success: true,
    message: isVerifiedPaid
      ? "Pengajuan berhasil. Status pesanan: Menunggu Pengembalian Dana."
      : "Pesanan dibatalkan. Status: Menunggu Pengembalian Dana.",
    status: "Menunggu Pengembalian Dana",
  });
}
