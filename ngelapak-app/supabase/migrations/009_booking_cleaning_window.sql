begin;

-- Keep the original exclusion constraint for overlapping rental days. Check
-- cleaning time for new checkout rows without invalidating historical bookings.
create function public.check_midtrans_cleaning_window()
returns trigger language plpgsql set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('midtrans-cleaning:' || new.spot_id::text, 0));
  if exists (
    select 1 from public.bookings b
    where b.spot_id = new.spot_id and b.status <> 'dibatalkan'
      and b.tanggal_mulai <= new.tanggal_selesai + 3
      and b.tanggal_selesai + 3 >= new.tanggal_mulai
  ) then
    raise exception 'Tanggal bertabrakan dengan jadwal sewa atau masa pembersihan. Pilih tanggal lain.';
  end if;
  return new;
end;
$$;
revoke execute on function public.check_midtrans_cleaning_window() from public;

create trigger check_midtrans_cleaning_window
before insert on public.bookings for each row
when (new.metode_pembayaran = 'midtrans' and new.spot_id is not null and new.status <> 'dibatalkan')
execute function public.check_midtrans_cleaning_window();

create or replace function public.get_reserved_lapak_dates(p_spot_id uuid)
returns table (tanggal_mulai date, tanggal_selesai date)
language sql stable security definer set search_path = ''
as $$
  select b.tanggal_mulai, b.tanggal_selesai from public.bookings b
  where b.spot_id = p_spot_id and b.status <> 'dibatalkan'
    and b.tanggal_selesai + 3 >= (now() at time zone 'Asia/Makassar')::date
    and (b.status <> 'menunggu' or b.payment_expires_at is null or b.payment_expires_at > now()
      or b.midtrans_status = 'perlu_ditinjau')
  order by b.tanggal_mulai;
$$;

create or replace function public.get_unavailable_lapak_ids(p_start date, p_end date)
returns table (spot_id uuid)
language sql stable security definer set search_path = ''
as $$
  select distinct b.spot_id from public.bookings b
  where p_start <= p_end and p_end - p_start < 30
    and b.spot_id is not null and b.status <> 'dibatalkan'
    and b.tanggal_mulai <= p_end + 3 and b.tanggal_selesai + 3 >= p_start
    and (b.status <> 'menunggu' or b.payment_expires_at is null or b.payment_expires_at > now()
      or b.midtrans_status = 'perlu_ditinjau');
$$;

commit;
