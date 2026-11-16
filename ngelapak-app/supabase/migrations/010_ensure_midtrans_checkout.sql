-- Pastikan kolom + fungsi Midtrans ada (aman dijalankan ulang).
-- Tanpa ini, /api/pembayaran/checkout gagal: "Pembayaran Midtrans belum tersedia di database."

begin;

alter table public.bookings
  add column if not exists payment_expires_at timestamptz,
  add column if not exists midtrans_checkout_url text,
  add column if not exists midtrans_status text,
  add column if not exists midtrans_transaction_id text,
  add column if not exists nama_usaha text,
  add column if not exists kategori_penjual text,
  add column if not exists verified_at timestamptz;

create index if not exists bookings_midtrans_pending
  on public.bookings (spot_id, payment_expires_at)
  where metode_pembayaran = 'midtrans' and status = 'menunggu';

create or replace function public.reserve_midtrans_booking(
  p_booking_id text, p_owner uuid, p_spot_kode text, p_tanggal_mulai date,
  p_jumlah_hari integer, p_total_bayar integer, p_jenis_usaha text,
  p_nama_usaha text, p_kategori_penjual text, p_catatan text
) returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  tenant public.profiles%rowtype;
  spot public.spots%rowtype;
  booking public.bookings%rowtype;
  created timestamptz := date_trunc('second', clock_timestamp());
begin
  if p_booking_id is null or p_booking_id !~ '^MT-[a-f0-9]{32}$' then
    raise exception 'ID pemesanan tidak valid.';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_booking_id, 0));
  select * into booking from public.bookings where id = p_booking_id;
  if found then
    if booking.owner_id is distinct from p_owner or booking.metode_pembayaran <> 'midtrans' then
      raise exception 'Pesanan tidak ditemukan.' using errcode = '42501';
    end if;
    if booking.spot_kode is distinct from p_spot_kode or booking.tanggal_mulai is distinct from p_tanggal_mulai
       or booking.jumlah_hari is distinct from p_jumlah_hari or booking.total_bayar is distinct from p_total_bayar then
      raise exception 'Data pesanan berubah. Mulai pembayaran baru.';
    end if;
    return to_jsonb(booking);
  end if;

  select * into tenant from public.profiles where id = p_owner and role = 'penyewa';
  if not found then
    raise exception 'Pemesanan hanya tersedia untuk penyewa.' using errcode = '42501';
  end if;
  if p_tanggal_mulai is null
     or created + interval '1 hour' > (p_tanggal_mulai + time '08:00') at time zone 'Asia/Makassar' then
    raise exception 'Pemesanan ditutup satu jam sebelum sewa mulai (08.00 WITA).';
  end if;
  if p_jumlah_hari is null or p_jumlah_hari not between 1 and 30
     or nullif(btrim(p_jenis_usaha), '') is null or nullif(btrim(p_nama_usaha), '') is null then
    raise exception 'Periksa durasi dan data pemesanan.';
  end if;
  select * into spot from public.spots where kode = p_spot_kode for share;
  if not found or spot.status = 'pemeliharaan' then
    raise exception 'Lapak tidak tersedia.';
  end if;
  if spot.tarif_per_hari <= 0 or spot.tarif_per_hari * p_jumlah_hari is distinct from p_total_bayar then
    raise exception 'Tarif lapak berubah. Muat ulang halaman sebelum membayar.';
  end if;

  insert into public.bookings (id, owner_id, spot_id, spot_nama, spot_kode, penyewa_nama,
    penyewa_nim, penyewa_fakultas, penyewa_telepon, penyewa_email, tanggal_mulai,
    tanggal_selesai, total_bayar, metode_pembayaran, jenis_usaha, nama_usaha,
    kategori_penjual, catatan, status, status_verifikasi, created_at, payment_expires_at, midtrans_status)
  values (p_booking_id, tenant.id, spot.id, spot.nama, spot.kode, tenant.nama, tenant.nim, tenant.fakultas,
    tenant.telepon, tenant.email, p_tanggal_mulai, p_tanggal_mulai + p_jumlah_hari - 1,
    p_total_bayar, 'midtrans', btrim(p_jenis_usaha), btrim(p_nama_usaha),
    p_kategori_penjual, p_catatan, 'menunggu', 'menunggu', created, created + interval '1 hour', 'pending')
  returning * into booking;

  insert into public.payments (booking_id, nominal, metode, status)
    values (booking.id, booking.total_bayar, 'midtrans', 'menunggu');

  return to_jsonb(booking);
exception when exclusion_violation then
  raise exception 'Tanggal lapak sudah dipesan atau sedang menunggu pembayaran.' using errcode = '23P01';
end;
$$;

create or replace function public.apply_midtrans_status(
  p_booking_id text, p_amount integer, p_transaction_id text, p_status text, p_paid_at timestamptz
) returns boolean language plpgsql security definer set search_path = ''
as $$
declare
  booking public.bookings%rowtype;
begin
  select * into booking from public.bookings
    where id = p_booking_id and metode_pembayaran = 'midtrans' for update;
  if not found then return false; end if;
  if booking.total_bayar is distinct from p_amount then
    raise exception 'Nominal pembayaran tidak cocok.';
  end if;
  if booking.midtrans_transaction_id is not null
     and p_transaction_id is not null
     and booking.midtrans_transaction_id <> p_transaction_id then
    raise exception 'ID transaksi tidak cocok.';
  end if;
  if booking.status_verifikasi = 'disetujui' or booking.midtrans_status = 'perlu_ditinjau' then
    return true;
  end if;

  if p_status = 'lunas' then
    if p_transaction_id is null or p_paid_at is null then
      raise exception 'Data konfirmasi pembayaran tidak lengkap.';
    end if;
    if booking.status <> 'menunggu' or p_paid_at > booking.payment_expires_at then
      update public.bookings set status = 'dibatalkan', status_verifikasi = 'ditolak',
        midtrans_status = 'perlu_ditinjau',
        midtrans_transaction_id = p_transaction_id where id = booking.id;
      update public.payments set status = 'gagal' where booking_id = booking.id;
      return true;
    end if;
    update public.bookings set status = 'aktif', status_verifikasi = 'disetujui', verified_at = p_paid_at,
      midtrans_status = 'settlement', midtrans_transaction_id = p_transaction_id where id = booking.id;
    update public.payments set status = 'lunas' where booking_id = booking.id;
  elsif p_status in ('expire', 'deny', 'cancel', 'failure') and booking.status = 'menunggu' then
    update public.bookings set status = 'dibatalkan', status_verifikasi = 'ditolak',
      midtrans_status = p_status, midtrans_transaction_id = coalesce(p_transaction_id, midtrans_transaction_id)
      where id = booking.id;
    update public.payments set status = 'gagal' where booking_id = booking.id;
  end if;
  return true;
end;
$$;

revoke execute on function public.reserve_midtrans_booking(text,uuid,text,date,integer,integer,text,text,text,text)
  from public, anon, authenticated;
revoke execute on function public.apply_midtrans_status(text,integer,text,text,timestamptz)
  from public, anon, authenticated;
grant execute on function public.reserve_midtrans_booking(text,uuid,text,date,integer,integer,text,text,text,text),
  public.apply_midtrans_status(text,integer,text,text,timestamptz) to service_role;

commit;
