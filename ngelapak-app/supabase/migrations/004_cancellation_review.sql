begin;

create function public.review_booking_cancellation(
  p_cancellation_id uuid, p_approve boolean, p_proof text, p_note text
) returns void language plpgsql security definer set search_path = ''
as $$
declare
  request public.cancellations%rowtype;
  booking public.bookings%rowtype;
begin
  if not public.is_admin() then
    raise exception 'Akses admin diperlukan.' using errcode = '42501';
  end if;
  if p_approve is null then
    raise exception 'Pilih keputusan pembatalan.';
  end if;

  -- Use the same lock order as payment review and tenant submission.
  select b.* into booking from public.bookings b
    join public.cancellations c on c.booking_id = b.id
    where c.id = p_cancellation_id for update of b;
  if not found then
    raise exception 'Pesanan tidak ditemukan.';
  end if;
  select * into request from public.cancellations where id = p_cancellation_id for update;
  if not found or request.status <> 'menunggu' then
    raise exception 'Pengajuan sudah diproses atau tidak ditemukan.';
  end if;

  if p_approve then
    if booking.status not in ('menunggu', 'aktif', 'dibatalkan')
       or booking.status_verifikasi = 'ditolak'
       or exists (select 1 from public.cancellations where booking_id = booking.id and status = 'disetujui') then
      raise exception 'Pesanan tidak dapat dibatalkan.';
    end if;
    if p_proof is null or split_part(p_proof, '/', 1) <> p_cancellation_id::text or not exists (
      select 1 from storage.objects where bucket_id = 'refund-proofs' and name = p_proof for update
    ) then
      raise exception 'Unggah bukti refund sebelum menyetujui.';
    end if;
    update public.bookings set status = 'dibatalkan' where id = booking.id;
    update public.cancellations set status = 'disetujui', bukti_refund = p_proof,
      resolved_at = now() where id = request.id;
  else
    if nullif(btrim(p_note), '') is null or length(p_note) > 1000 then
      raise exception 'Isi catatan penolakan maksimal 1.000 karakter.';
    end if;
    -- Older submissions already cancelled the booking. Restore its hold only
    -- if it can be restored without displacing another reservation.
    if booking.status = 'dibatalkan' and booking.status_verifikasi = 'menunggu'
       and not exists (select 1 from public.cancellations where booking_id = booking.id and status = 'disetujui') then
      if booking.tanggal_selesai < (now() at time zone 'Asia/Makassar')::date then
        raise exception 'Jadwal pengajuan lama sudah berakhir dan tidak dapat dipulihkan.';
      end if;
      update public.bookings set status = 'menunggu' where id = booking.id;
    end if;
    update public.cancellations set status = 'ditolak', admin_catatan = btrim(p_note),
      resolved_at = now() where id = request.id;
  end if;
exception when exclusion_violation then
  raise exception 'Jadwal pengajuan lama sudah terisi dan tidak dapat dipulihkan.' using errcode = '23P01';
end;
$$;

revoke execute on function public.review_booking_cancellation(uuid,boolean,text,text) from public, anon;
grant execute on function public.review_booking_cancellation(uuid,boolean,text,text) to authenticated;

create function public.get_reserved_lapak_dates(p_spot_id uuid)
returns table (tanggal_mulai date, tanggal_selesai date)
language sql stable security definer set search_path = ''
as $$
  select b.tanggal_mulai, b.tanggal_selesai from public.bookings b
  where b.spot_id = p_spot_id and b.status <> 'dibatalkan'
    and b.tanggal_selesai >= (now() at time zone 'Asia/Makassar')::date
  order by b.tanggal_mulai;
$$;

revoke execute on function public.get_reserved_lapak_dates(uuid) from public;
grant execute on function public.get_reserved_lapak_dates(uuid) to anon, authenticated;

commit;
