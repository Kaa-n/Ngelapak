-- A booking may only be created for H+2 or later in the WITA business day.
create or replace function public.enforce_minimum_rental_lead_time()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.tanggal_mulai < ((now() at time zone 'Asia/Makassar')::date + 2) then
    raise exception 'Tanggal mulai sewa paling cepat dua hari dari hari ini.' using errcode = '22023';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_bookings_minimum_rental_lead_time on public.bookings;
create trigger trg_bookings_minimum_rental_lead_time
before insert on public.bookings
for each row execute function public.enforce_minimum_rental_lead_time();
