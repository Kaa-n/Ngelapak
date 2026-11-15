begin;

alter function public.cancel_booking_as_tenant(text,text,text,text,text,text,text,text)
  rename to cancel_legacy_booking_as_tenant;
revoke execute on function public.cancel_legacy_booking_as_tenant(text,text,text,text,text,text,text,text)
  from public, anon, authenticated;

create function public.cancel_booking_as_tenant(
  p_booking_id text, p_nama text, p_nim text, p_telepon text, p_bank text,
  p_nomor_rekening text, p_nama_rekening text, p_alasan text
) returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  booking public.bookings%rowtype;
  cutoff timestamptz;
begin
  select * into booking from public.bookings where id = p_booking_id and owner_id = auth.uid() for update;
  if not found then raise exception 'Pesanan tidak ditemukan.' using errcode = '42501'; end if;
  if booking.metode_pembayaran is distinct from 'midtrans' then
    return public.cancel_legacy_booking_as_tenant(p_booking_id, p_nama, p_nim, p_telepon,
      p_bank, p_nomor_rekening, p_nama_rekening, p_alasan);
  end if;

  cutoff := least(booking.verified_at + interval '24 hours',
    ((booking.tanggal_mulai + time '08:00') at time zone 'Asia/Makassar') - interval '24 hours');
  if booking.status <> 'aktif' or booking.status_verifikasi <> 'disetujui'
     or booking.verified_at is null or booking.verified_at >= cutoff or clock_timestamp() > cutoff then
    raise exception 'Batas pengajuan pembatalan sudah lewat atau pesanan belum lunas.';
  end if;
  if exists (select 1 from public.cancellations where booking_id = booking.id) then
    raise exception 'Pengajuan pembatalan sudah tercatat.';
  end if;
  if exists (select 1 from unnest(array[p_nama, p_nim, p_telepon, p_bank,
    p_nomor_rekening, p_nama_rekening, p_alasan]) value where nullif(btrim(value), '') is null)
     or p_nomor_rekening !~ '^[0-9]{5,30}$' or length(p_alasan) > 1000 then
    raise exception 'Lengkapi identitas, alasan, dan nomor rekening yang valid.';
  end if;
  insert into public.cancellations (booking_id, nama, nim, telepon, bank, nomor_rekening,
    nama_rekening, alasan, status)
  values (booking.id, btrim(p_nama), btrim(p_nim), btrim(p_telepon), btrim(p_bank),
    p_nomor_rekening, btrim(p_nama_rekening), btrim(p_alasan), 'menunggu');
  return jsonb_build_object('success', true, 'message', 'Pengajuan menunggu keputusan admin.');
end;
$$;

alter function public.review_booking_cancellation(uuid,boolean,text,text) rename to review_legacy_cancellation;
revoke execute on function public.review_legacy_cancellation(uuid,boolean,text,text)
  from public, anon, authenticated;

create function public.review_booking_cancellation(
  p_cancellation_id uuid, p_approve boolean, p_proof text, p_note text
) returns void language plpgsql security definer set search_path = ''
as $$
declare
  booking public.bookings%rowtype;
begin
  if not public.is_admin() then raise exception 'Akses admin diperlukan.' using errcode = '42501'; end if;

  select b.* into booking from public.bookings b
    join public.cancellations c on c.booking_id = b.id where c.id = p_cancellation_id for update of b;
  if not found then raise exception 'Pesanan tidak ditemukan.'; end if;
  if booking.metode_pembayaran is distinct from 'midtrans' or p_approve is false then
    perform public.review_legacy_cancellation(p_cancellation_id, p_approve, p_proof, p_note);
    return;
  end if;
  if p_approve is null or booking.status <> 'aktif' or booking.status_verifikasi <> 'disetujui'
     or clock_timestamp() >= (booking.tanggal_mulai + time '08:00') at time zone 'Asia/Makassar' then
    raise exception 'Pembatalan hanya dapat disetujui sebelum sewa mulai.';
  end if;
  update public.cancellations set status = 'disetujui', resolved_at = now()
    where id = p_cancellation_id and status = 'menunggu';
  if not found then raise exception 'Pengajuan sudah diproses atau tidak ditemukan.'; end if;
  update public.bookings set status = 'dibatalkan' where id = booking.id;
end;
$$;

create function public.record_booking_refund(p_cancellation_id uuid, p_proof text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  if not public.is_admin() then raise exception 'Akses admin diperlukan.' using errcode = '42501'; end if;
  if p_proof is null or split_part(p_proof, '/', 1) <> p_cancellation_id::text or not exists (
    select 1 from storage.objects where bucket_id = 'refund-proofs' and name = p_proof for update
  ) then
    raise exception 'Unggah bukti transfer refund terlebih dahulu.';
  end if;
  update public.cancellations set bukti_refund = p_proof
    where id = p_cancellation_id and status = 'disetujui' and bukti_refund is null;
  if not found then raise exception 'Refund sudah tercatat atau pembatalan belum disetujui.'; end if;
end;
$$;

revoke execute on function public.cancel_booking_as_tenant(text,text,text,text,text,text,text,text),
  public.review_booking_cancellation(uuid,boolean,text,text), public.record_booking_refund(uuid,text) from public, anon;
grant execute on function public.cancel_booking_as_tenant(text,text,text,text,text,text,text,text),
  public.review_booking_cancellation(uuid,boolean,text,text), public.record_booking_refund(uuid,text) to authenticated;
commit;
