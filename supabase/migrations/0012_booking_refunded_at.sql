-- 0012_booking_refunded_at.sql
--
-- Track whether (and when) a cancelled booking has been refunded to
-- the client. NULL = not refunded yet; a timestamptz = the moment
-- admin marked it as refunded.
--
-- Why a timestamp (and not a boolean): we get the "tracked" state
-- AND the "when" for free, and the value can drive a small "تم
-- الاسترداد بتاريخ DD.MM.YYYY" note in the client portal.
--
-- The column is independent of cancellation: technically you can
-- mark a non-cancelled booking as refunded too, but the UI only
-- surfaces this state when status='cancelled'. We don't enforce
-- that at the DB level because it'd box in future use cases (partial
-- refund on an active booking, customer-initiated refund flow, etc.).

alter table public.bookings
  add column if not exists refunded_at timestamptz null;

comment on column public.bookings.refunded_at is
  'When the admin marked this booking as refunded to the client. '
  'NULL while a refund is still pending or not applicable. '
  'Independent of status — UI typically only surfaces this when '
  'status=cancelled and paid_amount > 0.';
