-- Migration 0002 — seed trips table with current data from components/data.ts
-- Run AFTER 0001_init.sql in the SQL Editor.
--
-- Safe to re-run: uses ON CONFLICT (slug) DO UPDATE so it acts as upsert.

insert into public.trips (
  slug, name, country, month, start_date, end_date,
  duration, price, currency, total_spots, available_spots,
  status, badge, image_url, blurb, includes, itinerary,
  price_subtitle, deposit, deadline, pdf_path, sort_order
)
values
  -- ─── 1. THAILAND (sold out) ───
  (
    'thailand',
    'تايلاند · بوكيت',
    'تايلاند',
    '26.06.2026 – 06.07.2026',
    '2026-06-26'::date,
    '2026-07-06'::date,
    '11 يوم',
    9990,
    'ILS',
    10,
    0,
    'sold-out',
    'نفدت المقاعد',
    'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=800&q=85',
    'شامل: طيران الإمارات ذهاباً وإياباً، فندق Deevana Plaza 4 نجوم، تأشيرة الدخول، 5 فعاليات منظمة، مرافقة عربية 24/7، نقل VIP، وإفطار يومي.',
    '[
      "طيران الإمارات ذهاباً وإياباً (مشمول)",
      "فندق Deevana Plaza Phuket 4 نجوم",
      "تأشيرة دخول تايلاند",
      "5 فعاليات منظمة",
      "مرافقة عربية 24/7",
      "نقل VIP من وإلى المطار",
      "إفطار يومي"
    ]'::jsonb,
    '[
      {"day": "اليوم 1-2", "title": "بانكوك — البداية", "desc": "وصول، جولة في معبد وات أرون، عشاء على نهر تشاو فرايا."},
      {"day": "اليوم 3-4", "title": "شيانغ ماي — الجبال", "desc": "محمية الفيلة، طبخ تايلاندي، وأسواق ليلية في القرية القديمة."},
      {"day": "اليوم 5-7", "title": "بوكيت — الجزر", "desc": "جولة بحرية لجزر فاي فاي، غطس، ومشاهدة الغروب من قارب طويل الذيل."},
      {"day": "اليوم 8-10", "title": "كرابي — الاسترخاء", "desc": "شواطئ بيضاء، يوغا الصباح، وسبا تايلاندي قبل الرجعة."}
    ]'::jsonb,
    'للمسافرة في الغرفة الزوجية · شامل كل شي',
    'دفعة أولى 5,000 ₪ فقط',
    '⏰ آخر موعد: 10.06.2026',
    '/thailand-program.pdf',
    1
  ),
  -- ─── 2. BANSKO (completed) ───
  (
    'bansko',
    'بانسكو',
    'بلغاريا',
    '01.2025',
    '2025-01-15'::date,
    '2025-01-21'::date,
    '7 أيام',
    0,
    'ILS',
    0,
    0,
    'completed',
    'انتهت',
    'https://images.unsplash.com/photo-1605540436563-5bca919ae766?w=800&q=85',
    'تزلج في جبال البيرين، شاليهات خشبية، وليالي حول الموقد. تجربة شتوية كاملة.',
    '[
      "شاليه فاخر 6 ليالي",
      "تذاكر تزلج كاملة",
      "معدات تزلج",
      "إفطار وعشاء يومي",
      "مدربة محلية"
    ]'::jsonb,
    '[
      {"day": "اليوم 1", "title": "صوفيا — الوصول", "desc": "استقبال من المطار وانتقال إلى بانسكو، عشاء ترحيبي."},
      {"day": "اليوم 2-5", "title": "تزلج وجلسات", "desc": "دروس تزلج للمبتدئات، جلسات سبا، ومطاعم الجبل."},
      {"day": "اليوم 6-7", "title": "صوفيا — العودة", "desc": "جولة في العاصمة، سوق الحرف، ورحلة العودة."}
    ]'::jsonb,
    null, null, null, null, 2
  ),
  -- ─── 3. ZANZIBAR (soon) ───
  (
    'zanzibar',
    'زنجيبار',
    'تنزانيا',
    '08.2026',
    '2026-08-01'::date,
    '2026-08-09'::date,
    '9 أيام',
    0,
    'ILS',
    0,
    0,
    'soon',
    'قريباً',
    'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800&q=85',
    'شواطئ بيضاء، مياه فيروزية، وغروب على المحيط الهندي. تفاصيل الرحلة قريباً.',
    '["تفاصيل الرحلة قريباً"]'::jsonb,
    '[{"day": "قريباً", "title": "البرنامج التفصيلي", "desc": "تابعينا على واتساب لتعرفي أول."}]'::jsonb,
    null, null, null, null, 3
  ),
  -- ─── 4. AMERICA (soon) ───
  (
    'america',
    'أمريكا',
    'الولايات المتحدة',
    '04.2027',
    '2027-04-01'::date,
    '2027-04-10'::date,
    '10 أيام',
    0,
    'ILS',
    0,
    0,
    'soon',
    'قريباً',
    'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=85',
    'مدن لا تنام، وجهات أيقونية، وتجارب أمريكية أصيلة. تفاصيل الرحلة قريباً.',
    '["تفاصيل الرحلة قريباً"]'::jsonb,
    '[{"day": "قريباً", "title": "البرنامج التفصيلي", "desc": "تابعينا على واتساب لتعرفي أول."}]'::jsonb,
    null, null, null, null, 4
  )
on conflict (slug) do update set
  name             = excluded.name,
  country          = excluded.country,
  month            = excluded.month,
  start_date       = excluded.start_date,
  end_date         = excluded.end_date,
  duration         = excluded.duration,
  price            = excluded.price,
  currency         = excluded.currency,
  total_spots      = excluded.total_spots,
  available_spots  = excluded.available_spots,
  status           = excluded.status,
  badge            = excluded.badge,
  image_url        = excluded.image_url,
  blurb            = excluded.blurb,
  includes         = excluded.includes,
  itinerary        = excluded.itinerary,
  price_subtitle   = excluded.price_subtitle,
  deposit          = excluded.deposit,
  deadline         = excluded.deadline,
  pdf_path         = excluded.pdf_path,
  sort_order       = excluded.sort_order,
  updated_at       = now();

-- Sanity check — should return 4 rows
select slug, name, status, available_spots, total_spots
from public.trips
order by sort_order;
