begin;

alter table public.profiles add column if not exists nim text,
  add column if not exists fakultas text, add column if not exists telepon text;
alter table public.bookings add column if not exists nama_usaha text,
  add column if not exists kategori_penjual text,
  add column if not exists verified_at timestamptz;

create or replace function public.generate_booking_id()
returns text language sql set search_path = ''
as $$
  select 'BKG-' || to_char(now() at time zone 'Asia/Makassar', 'YYYYMMDD')
    || '-' || upper(left(replace(gen_random_uuid()::text, '-', ''), 12));
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, nama, email, role)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'nama', ''),
    nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
    new.email, 'penyewa');
  return new;
end;
$$;

alter function public.is_admin() set search_path = '';
drop policy if exists profiles_insert_system on public.profiles;
revoke insert, update on public.profiles from public, anon, authenticated;
grant update (nama, nim, fakultas, telepon, updated_at) on public.profiles to authenticated;

-- Changes to a booking, payment or cancellation go through the workflow functions.
revoke insert, update, delete on public.bookings, public.payments, public.cancellations
  from public, anon, authenticated;

drop policy if exists product_captions_insert_owner_with_active_booking on public.product_captions;
drop policy if exists product_captions_update_owner_with_active_booking on public.product_captions;
drop policy if exists product_captions_all_admin on public.product_captions;

create policy caption_insert_during_rental on public.product_captions for insert to authenticated
  with check (owner_id = (select auth.uid()) and exists (
    select 1 from public.bookings b where b.owner_id = product_captions.owner_id
      and b.spot_id = product_captions.spot_id
      and b.status = 'aktif' and b.status_verifikasi = 'disetujui'
      and (now() at time zone 'Asia/Makassar')::date between b.tanggal_mulai and b.tanggal_selesai
  ));
create policy caption_update_during_rental on public.product_captions for update to authenticated
  using (owner_id = (select auth.uid()) and exists (
    select 1 from public.bookings b where b.owner_id = product_captions.owner_id
      and b.spot_id = product_captions.spot_id
      and b.status = 'aktif' and b.status_verifikasi = 'disetujui'
      and (now() at time zone 'Asia/Makassar')::date between b.tanggal_mulai and b.tanggal_selesai
  ));
revoke update on public.product_captions from public, anon, authenticated;
grant update (konten) on public.product_captions to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('payment-proofs', 'payment-proofs', false, 6291456, array['image/jpeg','image/png','application/pdf']),
  ('refund-proofs', 'refund-proofs', false, 6291456, array['image/jpeg','image/png','application/pdf']),
  ('spot-images', 'spot-images', true, 6291456, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy ngelapak_spot_images_public_read on storage.objects for select
  using (bucket_id = 'spot-images');
create policy ngelapak_spot_images_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'spot-images' and (select public.is_admin()));
create policy ngelapak_spot_images_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'spot-images' and (select public.is_admin()));

-- Payment uploads use <tenant UUID>/<file UUID>.<ext>.
create policy ngelapak_payment_proofs_read on storage.objects for select to authenticated
  using (bucket_id = 'payment-proofs' and (
    split_part(name, '/', 1) = (select auth.uid())::text or (select public.is_admin())
  ));
create policy ngelapak_payment_proofs_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'payment-proofs' and split_part(name, '/', 1) = (select auth.uid())::text);
create policy ngelapak_payment_proofs_unused_delete on storage.objects for delete to authenticated
  using (bucket_id = 'payment-proofs'
    and split_part(name, '/', 1) = (select auth.uid())::text
    and not exists (select 1 from public.bookings b where b.bukti_bayar = name)
    and not exists (select 1 from public.payments p where p.bukti_url = name));

-- Refund uploads use <cancellation UUID>/<file UUID>.<ext>.
create policy ngelapak_refund_proofs_read on storage.objects for select to authenticated
  using (bucket_id = 'refund-proofs' and (
    (select public.is_admin()) or exists (select 1 from public.cancellations c
      where c.bukti_refund = name and c.status = 'disetujui')
  ));
create policy ngelapak_refund_proofs_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'refund-proofs' and (select public.is_admin()));
create policy ngelapak_refund_proofs_unused_delete on storage.objects for delete to authenticated
  using (bucket_id = 'refund-proofs' and (select public.is_admin())
    and not exists (select 1 from public.cancellations c where c.bukti_refund = name));

create or replace function public.cancel_booking_as_tenant(
  p_booking_id text, p_nama text, p_nim text, p_telepon text, p_bank text,
  p_nomor_rekening text, p_nama_rekening text, p_alasan text
) returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  booking public.bookings%rowtype;
  requester uuid := auth.uid();
begin
  if requester is null then
    raise exception 'Silakan masuk terlebih dahulu.' using errcode = '42501';
  end if;

  select * into booking from public.bookings where id = p_booking_id for update;
  if not found or booking.owner_id is distinct from requester then
    raise exception 'Pesanan tidak ditemukan.' using errcode = '42501';
  end if;
  if booking.status <> 'menunggu' or booking.status_verifikasi <> 'menunggu'
     or now() > booking.created_at + interval '24 hours' then
    raise exception 'Pengajuan hanya tersedia dalam 24 jam sejak memesan dan sebelum verifikasi.';
  end if;
  if exists (select 1 from public.cancellations where booking_id = p_booking_id and status <> 'ditolak') then
    raise exception 'Pengajuan pembatalan sudah tercatat.';
  end if;
  if exists (select 1 from unnest(array[p_nama, p_nim, p_telepon, p_bank,
    p_nomor_rekening, p_nama_rekening, p_alasan]) value where nullif(btrim(value), '') is null)
     or p_nomor_rekening !~ '^[0-9]{5,30}$' then
    raise exception 'Lengkapi identitas, alasan, dan nomor rekening yang valid.';
  end if;

  insert into public.cancellations (booking_id, nama, nim, telepon, bank, nomor_rekening,
    nama_rekening, alasan, status)
  values (p_booking_id, btrim(p_nama), btrim(p_nim), btrim(p_telepon), btrim(p_bank),
    p_nomor_rekening, btrim(p_nama_rekening), btrim(p_alasan), 'menunggu');
  return jsonb_build_object('success', true, 'message', 'Pengajuan menunggu keputusan admin.');
end;
$$;

revoke execute on function public.cancel_booking_as_tenant(text,text,text,text,text,text,text,text)
  from public, anon;
grant execute on function public.cancel_booking_as_tenant(text,text,text,text,text,text,text,text)
  to authenticated;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Use a new RPC name so an older cloud overload cannot change how PostgREST
-- resolves the parameters. Replace the application's old caller in the same change.
create function public.submit_booking_with_payment(
  p_spot_kode text, p_tanggal_mulai date, p_jumlah_hari integer, p_total_bayar integer,
  p_metode_pembayaran text, p_jenis_usaha text, p_nama_usaha text,
  p_kategori_penjual text, p_catatan text, p_bukti_bayar text default null
) returns text language plpgsql security definer set search_path = ''
as $$
declare
  tenant public.profiles%rowtype;
  spot public.spots%rowtype;
  new_booking_id text;
  amount integer;
begin
  select * into tenant from public.profiles where id = auth.uid() and role = 'penyewa';
  if not found then
    raise exception 'Pemesanan hanya tersedia untuk penyewa.' using errcode = '42501';
  end if;
  if p_tanggal_mulai is null or p_tanggal_mulai < (now() at time zone 'Asia/Makassar')::date
     or p_jumlah_hari is null or p_jumlah_hari not between 1 and 30
     or nullif(btrim(p_metode_pembayaran), '') is null
     or nullif(btrim(p_nama_usaha), '') is null or nullif(btrim(p_jenis_usaha), '') is null then
    raise exception 'Periksa tanggal, durasi, dan data pemesanan.';
  end if;
  select * into spot from public.spots where kode = p_spot_kode for share;
  if not found or spot.status = 'pemeliharaan' then
    raise exception 'Lapak tidak tersedia.';
  end if;
  amount := spot.tarif_per_hari * p_jumlah_hari;
  if amount <= 0 or amount is distinct from p_total_bayar then
    raise exception 'Tarif lapak berubah. Muat ulang halaman sebelum membayar.';
  end if;
  if p_bukti_bayar is not null and not exists (
    select 1 from storage.objects where bucket_id = 'payment-proofs' and name = p_bukti_bayar
      and split_part(name, '/', 1) = tenant.id::text for update
  ) then
    raise exception 'Bukti transfer tidak ditemukan.';
  end if;
  if p_bukti_bayar is not null and exists (
    select 1 from public.bookings where bukti_bayar = p_bukti_bayar
  ) then
    raise exception 'Bukti transfer sudah dipakai.';
  end if;

  insert into public.bookings (owner_id, spot_id, spot_nama, spot_kode, penyewa_nama,
    penyewa_nim, penyewa_fakultas, penyewa_telepon, penyewa_email, tanggal_mulai,
    tanggal_selesai, total_bayar, metode_pembayaran, jenis_usaha, nama_usaha,
    kategori_penjual, catatan, bukti_bayar, status, status_verifikasi)
  values (tenant.id, spot.id, spot.nama, spot.kode, tenant.nama, tenant.nim, tenant.fakultas,
    tenant.telepon, tenant.email, p_tanggal_mulai, p_tanggal_mulai + p_jumlah_hari - 1,
    amount, p_metode_pembayaran, p_jenis_usaha, p_nama_usaha, p_kategori_penjual,
    p_catatan, p_bukti_bayar, 'menunggu', 'menunggu')
  returning id into new_booking_id;
  insert into public.payments (booking_id, bukti_url, nominal, metode, status)
    values (new_booking_id, p_bukti_bayar, amount, p_metode_pembayaran, 'menunggu');
  return new_booking_id;
exception when exclusion_violation then
  raise exception 'Tanggal lapak sudah dipesan.' using errcode = '23P01';
end;
$$;

revoke execute on function public.submit_booking_with_payment(text,date,integer,integer,text,text,text,text,text,text)
  from public, anon;
grant execute on function public.submit_booking_with_payment(text,date,integer,integer,text,text,text,text,text,text)
  to authenticated;

do $$
declare
  old_rpc regprocedure;
begin
  for old_rpc in select p.oid::regprocedure from pg_proc p
    join pg_namespace n on p.pronamespace = n.oid
    where n.nspname = 'public' and p.proname = 'create_booking_with_payment'
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', old_rpc);
  end loop;
end;
$$;

commit;
