import LoginForm from "./LoginForm";

type SearchParams = Promise<{ next?: string }>;

export const metadata = {
  title: "تسجيل دخول الأدمن — SeeYa",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { next } = await searchParams;

  return (
    <main
      className="min-h-screen grid place-items-center px-5"
      style={{
        background:
          "linear-gradient(135deg, #faf8f3 0%, #ffffff 50%, #fff5f7 100%)",
      }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-ink mb-2">SeeYa</h1>
          <p
            className="text-ink/60 text-sm uppercase tracking-[0.3em]"
            dir="ltr"
          >
            Admin Panel
          </p>
        </div>

        <div
          className="rounded-3xl p-8 md:p-10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.15)]"
          style={{
            backgroundColor: "white",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <h2 className="text-2xl font-black text-ink text-right mb-1">
            تسجيل دخول الإدارة
          </h2>
          <p className="text-ink/60 text-sm text-right mb-7">
            هذه الصفحة مخصصة للمسؤولين فقط
          </p>

          <LoginForm nextPath={next} />
        </div>

        <p className="text-center text-ink/40 text-xs mt-6">
          محميّ بـ Supabase · لا تشاركي بيانات الدخول
        </p>
      </div>
    </main>
  );
}
