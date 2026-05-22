import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import WelcomeForm from "./WelcomeForm";

export const metadata = { title: "أهلاً بكِ — SeeYa" };

type SearchParams = Promise<{ next?: string }>;

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { next } = await searchParams;

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone")
    .eq("id", user.id)
    .single();

  // Already completed? Send her where she was going.
  if (profile?.full_name?.trim() && profile?.phone?.trim()) {
    redirect(next ?? "/account");
  }

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
            أهلاً وسهلاً 🌸
          </h2>
          <p className="text-ink/60 text-sm text-right mb-7">
            خبّرينا عن نفسك عشان نخصّصلك كل شي
          </p>

          <WelcomeForm nextPath={next ?? "/account"} />
        </div>
      </div>
    </main>
  );
}
