-- SeeYa — Phase 4: PDF storage for trip programs
-- Migration 0004 — create the trip-pdfs bucket + RLS policies
--
-- Run this in: Supabase Dashboard → SQL Editor → New query → paste → Run
--
-- WHY:
-- Each trip has a downloadable PDF program. Admin uploads it from
-- /admin/trips/[id] (and /admin/pdfs). The public site links to it
-- from the trip modal. Bucket is public-read so unauthenticated
-- visitors can download. Only admins can upload/replace/delete.

-- ─────────────────────────────────────────────────────────────
-- 1. Create the bucket (public read)
-- ─────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'trip-pdfs',
  'trip-pdfs',
  true,
  10 * 1024 * 1024,                -- 10 MB cap per file
  array['application/pdf']         -- PDFs only
)
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ─────────────────────────────────────────────────────────────
-- 2. RLS policies on storage.objects for the trip-pdfs bucket
-- ─────────────────────────────────────────────────────────────

-- Public read — anyone can SELECT/download files
drop policy if exists "trip_pdfs_public_read" on storage.objects;
create policy "trip_pdfs_public_read"
  on storage.objects for select
  using (bucket_id = 'trip-pdfs');

-- Admin insert
drop policy if exists "trip_pdfs_admin_insert" on storage.objects;
create policy "trip_pdfs_admin_insert"
  on storage.objects for insert
  with check (bucket_id = 'trip-pdfs' and public.is_admin());

-- Admin update (overwrite)
drop policy if exists "trip_pdfs_admin_update" on storage.objects;
create policy "trip_pdfs_admin_update"
  on storage.objects for update
  using (bucket_id = 'trip-pdfs' and public.is_admin());

-- Admin delete
drop policy if exists "trip_pdfs_admin_delete" on storage.objects;
create policy "trip_pdfs_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'trip-pdfs' and public.is_admin());
