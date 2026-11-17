-- Allow tenants to cancel paid/verified bookings within the refund window.
-- Older cancel_booking_as_tenant rejected status_verifikasi <> 'menunggu'.

begin;

create or replace function public.cancel_booking_as_tenant(
  p_booking_id text, p_nama text, p_nim text, p_telepon text, p_bank text,
  p_nomor_rekening text, p_nama_rekening text, p_alasan text
) returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  booking public.bookings%rowtype;
  cutoff timestamptz;
  hold_schedule boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Silakan masuk terlebih dahulu.' using errcode = '42501';
  end if;

  select * into booking from public.bookings
    where id = p_booking_id and owner_id = auth.uid() for update;
  if not found then
    raise exception 'Pesanan tidak ditemukan.' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.cancellations
    where booking_id = booking.id and status <> 'ditolak'
  ) then
    raise exception 'Pengajuan pembatalan sudah tercatat.';
  end if;

  if exists (
    select 1 from unnest(array[p_nama, p_nim, p_telepon, p_bank,
      p_nomor_rekening, p_nama_rekening, p_alasan]) value
    where nullif(btrim(value), '') is null
  ) or p_nomor_rekening !~ '^[0-9]{5,30}$' or length(p_alasan) > 1000 then
    raise exception 'Lengkapi identitas, alasan, dan nomor rekening yang valid.';
  end if;

  if booking.status = 'aktif'
     and booking.status_verifikasi = 'disetujui'
     and booking.verified_at is not null then
    cutoff := least(
      booking.verified_at + interval '24 hours',
      ((booking.tanggal_mulai + time '08:00') at time zone 'Asia/Makassar') - interval '24 hours'
    );
    if booking.verified_at >= cutoff or clock_timestamp() > cutoff then
      raise exception 'Batas pengajuan pembatalan sudah lewat atau pesanan belum lunas.';
    end if;
    hold_schedule := true;
  elsif booking.status = 'menunggu' and booking.status_verifikasi = 'menunggu' then
    if clock_timestamp() > booking.created_at + interval '24 hours' then
      raise exception 'Batas waktu pembatalan mandiri (1×24 jam) telah habis.';
    end if;
  else
    raise exception 'Pesanan ini tidak dapat diajukan pembatalannya saat ini.';
  end if;

  insert into public.cancellations (
    booking_id, nama, nim, telepon, bank, nomor_rekening, nama_rekening, alasan, status
  ) values (
    booking.id, btrim(p_nama), btrim(p_nim), btrim(p_telepon), btrim(p_bank),
    p_nomor_rekening, btrim(p_nama_rekening), btrim(p_alasan), 'menunggu'
  );

  if not hold_schedule then
    update public.bookings set status = 'dibatalkan' where id = booking.id;
  end if;

  return jsonb_build_object(
    'success', true,
    'message', 'Pengajuan berhasil. Status pesanan: Menunggu Pengembalian Dana.',
    'status', 'Menunggu Pengembalian Dana'
  );
end;
$$;

revoke execute on function public.cancel_booking_as_tenant(text,text,text,text,text,text,text,text)
  from public, anon;
grant execute on function public.cancel_booking_as_tenant(text,text,text,text,text,text,text,text)
  to authenticated;

commit;
