begin;

-- Captions are owned by the tenant who made a paid booking.  They are no
-- longer tied to the current rental date, so the tenant can prepare them once
-- payment is confirmed.
drop policy if exists caption_insert_during_rental on public.product_captions;
drop policy if exists caption_update_during_rental on public.product_captions;

create policy caption_insert_after_paid_booking on public.product_captions
for insert to authenticated
with check (
  owner_id = (select auth.uid())
  and exists (
    select 1 from public.bookings b
    where b.owner_id = product_captions.owner_id
      and b.spot_id = product_captions.spot_id
      and b.status_verifikasi = 'disetujui'
      and b.status <> 'dibatalkan'
      and b.verified_at is not null
      and exists (
        select 1 from public.payments p
        where p.booking_id = b.id and p.status = 'lunas'
      )
  )
);

create policy caption_update_after_paid_booking on public.product_captions
for update to authenticated
using (
  owner_id = (select auth.uid())
  and exists (
    select 1 from public.bookings b
    where b.owner_id = product_captions.owner_id
      and b.spot_id = product_captions.spot_id
      and b.status_verifikasi = 'disetujui'
      and b.status <> 'dibatalkan'
      and b.verified_at is not null
      and exists (select 1 from public.payments p where p.booking_id = b.id and p.status = 'lunas')
  )
)
with check (owner_id = (select auth.uid()));

commit;
