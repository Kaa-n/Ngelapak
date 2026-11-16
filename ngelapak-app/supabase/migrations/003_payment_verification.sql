begin;

create function public.review_booking_payment(p_booking_id text, p_approve boolean)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  booking public.bookings%rowtype;
  payment public.payments%rowtype;
  proof text;
  decided_at timestamptz := now();
begin
  if not public.is_admin() then
    raise exception 'Akses admin diperlukan.' using errcode = '42501';
  end if;
  if p_approve is null then
    raise exception 'Pilih keputusan verifikasi.';
  end if;

  select * into booking from public.bookings where id = p_booking_id for update;
  if not found or booking.status <> 'menunggu' or booking.status_verifikasi <> 'menunggu' then
    raise exception 'Pesanan sudah diproses atau tidak ditemukan.';
  end if;
  if exists (select 1 from public.cancellations where booking_id = p_booking_id and status = 'menunggu') then
    raise exception 'Selesaikan pengajuan pembatalan terlebih dahulu.';
  end if;

  select * into payment from public.payments where booking_id = p_booking_id
    order by created_at desc, id desc limit 1 for update;
  if payment.id is not null and payment.status <> 'menunggu' then
    raise exception 'Status pembayaran tidak lagi menunggu verifikasi.';
  end if;
  proof := coalesce(nullif(payment.bukti_url, ''), nullif(booking.bukti_bayar, ''));
  if p_approve then
    if proof is null then
      raise exception 'Bukti transfer belum tersedia.';
    end if;
    if proof !~ '^https://' and not exists (
      select 1 from storage.objects where bucket_id = 'payment-proofs' and name = proof
    ) then
      raise exception 'Bukti transfer tidak ditemukan di penyimpanan.';
    end if;
    if booking.spot_id is null or booking.total_bayar is null or booking.total_bayar <= 0 then
      raise exception 'Data lapak atau tagihan tidak lengkap.';
    end if;
    if booking.tanggal_selesai < (now() at time zone 'Asia/Makassar')::date then
      raise exception 'Periode sewa sudah berakhir.';
    end if;
    perform 1 from public.spots where id = booking.spot_id and status <> 'pemeliharaan' for share;
    if not found then
      raise exception 'Lapak sedang tidak tersedia.';
    end if;
  end if;

  update public.bookings set
    status = case when p_approve then 'aktif' else 'dibatalkan' end,
    status_verifikasi = case when p_approve then 'disetujui' else 'ditolak' end,
    verified_at = decided_at
    where id = p_booking_id;
  if payment.id is null then
    insert into public.payments (booking_id, bukti_url, nominal, metode, status)
    values (booking.id, proof, booking.total_bayar, booking.metode_pembayaran,
      case when p_approve then 'lunas' else 'gagal' end);
  else
    update public.payments set status = case when p_approve then 'lunas' else 'gagal' end
      where id = payment.id;
  end if;
exception when exclusion_violation then
  raise exception 'Tanggal lapak bertabrakan dengan pesanan lain.' using errcode = '23P01';
end;
$$;

revoke execute on function public.review_booking_payment(text,boolean) from public, anon;
grant execute on function public.review_booking_payment(text,boolean) to authenticated;

commit;
