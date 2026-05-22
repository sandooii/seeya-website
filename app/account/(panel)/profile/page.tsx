import { createServerSupabaseClient } from "@/lib/supabase/server";
import ProfileForm from "./ProfileForm";

export const metadata = { title: "بياناتي — SeeYa" };

export default async function ProfilePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, email")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-6 max-w-2xl" dir="rtl">
      <header>
        <h1 className="text-4xl md:text-5xl font-black text-ink">بياناتي</h1>
        <p className="text-ink/60 mt-2">
          تقدري تغيّري اسمك أو رقمك في أي وقت
        </p>
      </header>

      <div className="bg-white rounded-3xl border border-ink/5 p-6 md:p-8">
        <ProfileForm
          defaultName={profile?.full_name ?? ""}
          defaultPhone={profile?.phone ?? ""}
          email={profile?.email ?? user.email ?? ""}
        />
      </div>
    </div>
  );
}
