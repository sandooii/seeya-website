import Link from "next/link";
import LoginForm from "./LoginForm";

type SearchParams = Promise<{ next?: string }>;

export const metadata = {
  title: "تسجيل دخول — SeeYa",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { next } = await searchParams;

  return (
    <main
      className="min-h-screen grid place-items-center px-5 py-12"
      style={{
        background:
          "linear-gradient(135deg, #fff5f7 0%, #faf8f3 50%, #fff5f7 100%)",
      }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-5xl font-black text-ink mb-1">SeeYa</h1>
            <p
              className="text-coral text-xs uppercase tracking-[0.4em]"
              dir="ltr"
            >
              Travel with the girls
            </p>
          </Link>
        </div>

        <div
          className="rounded-3xl p-8 md:p-10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.12)]"
          style={{
            backgroundColor: "white",
            border: "1px solid rgba(0,0,0,0.06)",
          }}
        >
          <h2 className="text-2xl md:text-3xl font-black text-ink text-right mb-1">
            أهلاً بعودتك ✨
          </h2>
          <p className="text-ink/60 text-sm text-right mb-7">
            ادخلي إيميلك ونرسلك كود لمرة واحدة
          </p>

          <LoginForm nextPath={next} />
        </div>

        <p className="text-center text-ink/40 text-xs mt-6">
          بتسجيلك بتوافقي على شروط الاستخدام
        </p>

        <p className="text-center mt-3">
          <Link
            href="/"
            className="text-sm text-ink/50 hover:text-coral transition-colors"
          >
            ← الرجوع للصفحة الرئيسية
          </Link>
        </p>
      </div>
    </main>
  );
}
