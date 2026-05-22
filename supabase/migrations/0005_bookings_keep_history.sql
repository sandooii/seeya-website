-- SeeYa — Phase 7C
-- Migration 0005 — keep booking rows when a client is deleted
--
-- Why: the original 0001 schema CASCADEd bookings when a profile was
-- deleted. Now that admins can delete clients from /admin/clients, we
-- need to preserve the booking history (and just unlink it). The
-- existing inline client_name/client_phone columns are enough to keep
-- the booking meaningful after the link is severed.

alter table public.bookings
  drop constraint if exists bookings_client_id_fkey;

alter table public.bookings
  add constraint bookings_client_id_fkey
  foreign key (client_id)
  references public.profiles(id)
  on delete set null;
