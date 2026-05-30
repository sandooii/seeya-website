-- 0010_auto_status_from_paid_amount.sql
--
-- Make booking.status authoritative from paid_amount + total_amount.
-- Until now the admin set status manually inside the form, while the
-- client UI computed a "displayStatus" from the real money fields.
-- That left the column open to drift: a booking could read 'paid_full'
-- in the DB while paid_amount < total_amount, breaking admin filters,
-- stats and CSV exports even though the client-side badge was correct.
--
-- Strategy: trigger BEFORE INSERT OR UPDATE that derives status from
-- the amounts. We deliberately preserve 'cancelled' — once an admin
-- cancels a booking, money adjustments don't auto-resurrect it.
--
-- For everything else:
--   paid_amount = 0                   -> pending_deposit
--   0 < paid_amount < total_amount    -> deposit_paid
--   paid_amount >= total_amount > 0   -> paid_full
--   total_amount = 0                  -> pending_deposit (defensive)

create or replace function public.bookings_compute_status()
returns trigger
language plpgsql
as $$
begin
  -- Respect a deliberate cancellation. Admin still owns the toggle.
  if new.status = 'cancelled' then
    return new;
  end if;

  if new.total_amount is null or new.total_amount <= 0 then
    new.status := 'pending_deposit';
  elsif new.paid_amount is null or new.paid_amount <= 0 then
    new.status := 'pending_deposit';
  elsif new.paid_amount >= new.total_amount then
    new.status := 'paid_full';
  else
    new.status := 'deposit_paid';
  end if;

  return new;
end;
$$;

drop trigger if exists bookings_compute_status_trg on public.bookings;
create trigger bookings_compute_status_trg
before insert or update of paid_amount, total_amount, status
on public.bookings
for each row
execute function public.bookings_compute_status();

-- One-shot reconciliation for any pre-existing drift.
-- We do this in two passes so the trigger fires on each row without
-- having to special-case the bulk update.
update public.bookings
set paid_amount = paid_amount
where status <> 'cancelled'
  and (
    (paid_amount >= total_amount and total_amount > 0 and status <> 'paid_full')
    or (paid_amount > 0 and paid_amount < total_amount and status <> 'deposit_paid')
    or (paid_amount <= 0 and status <> 'pending_deposit')
  );
