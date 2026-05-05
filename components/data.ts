export type TripStatus = "live" | "completed" | "soon" | "open";

export type Trip = {
  id: string;
  name: string;
  country: string;
  month: string;
  duration: string;
  price: number;
  /** "₪" for ILS, "$" for USD. Defaults to USD when omitted. */
  currency?: "₪" | "$";
  spots: number;
  status: TripStatus;
  badge: string;
  image: string;
  blurb: string;
  itinerary: { day: string; title: string; desc: string }[];
  includes: string[];
  /** Small line under the price in the modal */
  priceSubtitle?: string;
  /** Deposit pill text shown in the modal */
  deposit?: string;
  /** Registration deadline shown in the modal */
  deadline?: string;
  /** PDF program URL — when set, modal renders a download button */
  pdf?: string;
};

/** Returns the formatted price string, or null when there's no price to show. */
export function formatPrice(trip: Trip): string | null {
  if (trip.price <= 0) return null;
  const num = trip.price.toLocaleString("en-US");
  return trip.currency === "₪" ? `${num} ₪` : `$${num}`;
}

export const trips: Trip[] = [
  {
    id: "thailand",
    name: "تايلاند · بوكيت",
    country: "تايلاند",
    month: "26.06.2026 – 06.07.2026",
    duration: "11 يوم",
    price: 9990,
    currency: "₪",
    priceSubtitle: "للمسافرة في الغرفة الزوجية · شامل كل شي",
    deposit: "دفعة أولى 5,000 ₪ فقط",
    deadline: "⏰ آخر موعد: 10.06.2026",
    pdf: "/thailand-program.pdf",
    spots: 7,
    status: "live",
    badge: "متاحة الآن",
    image:
      "https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=800&q=85",
    blurb:
      "شامل: طيران الإمارات ذهاباً وإياباً، فندق Deevana Plaza 4 نجوم، تأشيرة الدخول، 5 فعاليات منظمة، مرافقة عربية 24/7، نقل VIP، وإفطار يومي.",
    itinerary: [
      {
        day: "اليوم 1-2",
        title: "بانكوك — البداية",
        desc: "وصول، جولة في معبد وات أرون، عشاء على نهر تشاو فرايا.",
      },
      {
        day: "اليوم 3-4",
        title: "شيانغ ماي — الجبال",
        desc: "محمية الفيلة، طبخ تايلاندي، وأسواق ليلية في القرية القديمة.",
      },
      {
        day: "اليوم 5-7",
        title: "بوكيت — الجزر",
        desc: "جولة بحرية لجزر فاي فاي، غطس، ومشاهدة الغروب من قارب طويل الذيل.",
      },
      {
        day: "اليوم 8-10",
        title: "كرابي — الاسترخاء",
        desc: "شواطئ بيضاء، يوغا الصباح، وسبا تايلاندي قبل الرجعة.",
      },
    ],
    includes: [
      "طيران الإمارات ذهاباً وإياباً (مشمول)",
      "فندق Deevana Plaza Phuket 4 نجوم",
      "تأشيرة دخول تايلاند",
      "5 فعاليات منظمة",
      "مرافقة عربية 24/7",
      "نقل VIP من وإلى المطار",
      "إفطار يومي",
    ],
  },
  {
    id: "bansko",
    name: "بانسكو",
    country: "بلغاريا",
    month: "01.2025",
    duration: "7 أيام",
    price: 0,
    spots: 0,
    status: "completed",
    badge: "انتهت",
    image:
      "https://images.unsplash.com/photo-1605540436563-5bca919ae766?w=800&q=85",
    blurb:
      "تزلج في جبال البيرين، شاليهات خشبية، وليالي حول الموقد. تجربة شتوية كاملة.",
    itinerary: [
      {
        day: "اليوم 1",
        title: "صوفيا — الوصول",
        desc: "استقبال من المطار وانتقال إلى بانسكو، عشاء ترحيبي.",
      },
      {
        day: "اليوم 2-5",
        title: "تزلج وجلسات",
        desc: "دروس تزلج للمبتدئات، جلسات سبا، ومطاعم الجبل.",
      },
      {
        day: "اليوم 6-7",
        title: "صوفيا — العودة",
        desc: "جولة في العاصمة، سوق الحرف، ورحلة العودة.",
      },
    ],
    includes: [
      "شاليه فاخر 6 ليالي",
      "تذاكر تزلج كاملة",
      "معدات تزلج",
      "إفطار وعشاء يومي",
      "مدربة محلية",
    ],
  },
  {
    id: "zanzibar",
    name: "زنجيبار",
    country: "تنزانيا",
    month: "08.2026",
    duration: "9 أيام",
    price: 0,
    spots: 0,
    status: "soon",
    badge: "قريباً",
    image:
      "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800&q=85",
    blurb:
      "شواطئ بيضاء، مياه فيروزية، وغروب على المحيط الهندي. تفاصيل الرحلة قريباً.",
    itinerary: [
      {
        day: "قريباً",
        title: "البرنامج التفصيلي",
        desc: "تابعينا على واتساب لتعرفي أول.",
      },
    ],
    includes: ["تفاصيل الرحلة قريباً"],
  },
  {
    id: "america",
    name: "أمريكا",
    country: "الولايات المتحدة",
    month: "04.2027",
    duration: "10 أيام",
    price: 0,
    spots: 0,
    status: "soon",
    badge: "قريباً",
    image:
      "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=85",
    blurb:
      "مدن لا تنام، وجهات أيقونية، وتجارب أمريكية أصيلة. تفاصيل الرحلة قريباً.",
    itinerary: [
      {
        day: "قريباً",
        title: "البرنامج التفصيلي",
        desc: "تابعينا على واتساب لتعرفي أول.",
      },
    ],
    includes: ["تفاصيل الرحلة قريباً"],
  },
];

export const destinations = [
  "تايلاند",
  "بانسكو",
  "زنجيبار",
  "أمريكا",
  "اليونان",
  "المالديف",
  "إسطنبول",
  "طوكيو",
  "لشبونة",
  "ميكونوس",
  "كابادوكيا",
  "مراكش",
];

export const galleryImages = [
  {
    src: "https://images.unsplash.com/photo-1539635278303-d4002c07eae3?auto=format&fit=crop&w=900&q=80",
    alt: "بنات في رحلة على البحر",
    span: "row-span-2",
  },
  {
    src: "https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?auto=format&fit=crop&w=900&q=80",
    alt: "شارع باريسي",
    span: "",
  },
  {
    src: "https://images.unsplash.com/photo-1504609813442-a8924e83f76e?auto=format&fit=crop&w=900&q=80",
    alt: "حقول بالي",
    span: "row-span-2",
  },
  {
    src: "https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?auto=format&fit=crop&w=900&q=80",
    alt: "غروب الشاطئ",
    span: "",
  },
  {
    src: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=900&q=80",
    alt: "جبال الثلج",
    span: "",
  },
];

export const avatars = [
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=200&q=80",
];

export const faqs = [
  {
    q: "شو مشمول بسعر الرحلة؟",
    a: "السعر شامل: الطيران ذهاباً وإياباً، الفندق، التنقلات الداخلية، النشاطات الرئيسية، المرافقة العربية 24/7، ونقل VIP من وإلى المطار.",
  },
  {
    q: "أنا مسافرة لحالي — مناسب؟",
    a: "طبعاً! معظم بناتنا بيجوا لحالهن وبيرجعوا صديقات من العمر، يعني أجواء حلوة وآمنة.",
  },
  {
    q: "كيف بتم الحجز والدفع؟",
    a: "تواصلي معنا على الواتساب، منرسلكِ كل تفاصيل الرحلة، وبتحجزي مكانكِ بدفع مقدم عشان نأكد محلك بالرحلة.",
  },
  {
    q: "شو سياسة الإلغاء؟",
    a: "عندنا سياسة إلغاء مرنة. التفاصيل كلها بملف سياسة الإلغاء، اضغطي عليه للتحميل.",
  },
  {
    q: "شو إذا كنت ما بعرف حدا بالمجموعة؟",
    a: "هذا أحلى جزء بالرحلة! كثير من البنات أجوا لحالهن ورجعوا بصاحبات من العمر.",
  },
];
