"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  UserPlus,
  Loader2,
  CheckCircle2,
  Copy,
  MessageCircle,
  X,
} from "lucide-react";
import { convertBookingToClient } from "./actions";
import { waLink } from "@/lib/contact";

type Result =
  | {
      ok: true;
      loginUsername: string;
      password: string;
      linkedExtra: number;
    }
  | { ok: false; error: string };

export default function ConvertToClientButton({
  bookingId,
  clientName,
  clientEmail,
  clientPhone,
  hasAccount,
}: {
  bookingId: string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string | null;
  /** True when the booking is already linked to a real account. */
  hasAccount: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<Result | null>(null);

  if (hasAccount) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
        <CheckCircle2 size={13} />
        مربوط بحساب
      </span>
    );
  }

  const handleConvert = () => {
    setResult(null);
    startTransition(async () => {
      const r = await convertBookingToClient(bookingId);
      if (r.ok && r.loginUsername && r.password) {
        setResult({
          ok: true,
          loginUsername: r.loginUsername,
          password: r.password,
          linkedExtra: r.linkedExtra ?? 0,
        });
        router.refresh();
      } else {
        setResult({ ok: false, error: r.error ?? "تعذّر التحويل" });
      }
    });
  };

  // Email no longer required — phone is sufficient
  const canConvert = !!clientPhone;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={!canConvert}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-coral text-white text-sm font-bold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        title={
          !canConvert
            ? "أضيفي رقم تلفون أولاً"
            : "إنشاء حساب لهالعميلة"
        }
      >
        <UserPlus size={16} />
        <span>إنشاء حساب لهالعميلة</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[200] grid place-items-center px-4"
        >
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => !pending && setOpen(false)}
          />
          <div
            className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full p-7 text-right"
            dir="rtl"
          >
            <button
              type="button"
              onClick={() => !pending && setOpen(false)}
              aria-label="إغلاق"
              className="absolute top-4 left-4 w-9 h-9 grid place-items-center rounded-full text-ink/40 hover:text-ink hover:bg-ink/5 transition-colors"
            >
              <X size={18} />
            </button>

            {!result && (
              <>
                <div className="w-12 h-12 rounded-2xl bg-coral/15 text-coral grid place-items-center mb-4">
                  <UserPlus size={22} />
                </div>
                <h2 className="text-2xl font-black text-ink mb-2">
                  إنشاء حساب لـ {clientName}؟
                </h2>
                <p className="text-ink/70 text-sm mb-3">
                  بنعمل حساب للعميلة باستخدام:
                </p>
                <ul className="text-sm space-y-1.5 bg-ink/3 rounded-2xl p-4 mb-4">
                  <li>
                    <span className="text-ink/55">اسم المستخدم:</span>{" "}
                    <strong dir="ltr">
                      {clientEmail || clientPhone?.replace(/\D/g, "")}
                    </strong>{" "}
                    {!clientEmail && (
                      <span className="text-ink/40 text-xs">
                        (رقم تلفونها — مفي إيميل)
                      </span>
                    )}
                  </li>
                  <li>
                    <span className="text-ink/55">كلمة السر:</span>{" "}
                    <strong dir="ltr">
                      {clientPhone?.replace(/\D/g, "")}
                    </strong>{" "}
                    <span className="text-ink/40 text-xs">
                      (رقم تلفونها أرقام فقط)
                    </span>
                  </li>
                </ul>
                <p className="text-ink/55 text-xs mb-6">
                  أي حجوزات تانية بنفس الرقم رح تنربط بالحساب تلقائياً.
                </p>

                <div className="flex gap-3 justify-start">
                  <button
                    type="button"
                    onClick={handleConvert}
                    disabled={pending}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-coral text-white font-bold hover:brightness-110 disabled:opacity-60"
                  >
                    {pending && (
                      <Loader2 size={16} className="animate-spin" />
                    )}
                    {pending ? "جاري الإنشاء..." : "أنشئي الحساب"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    disabled={pending}
                    className="px-5 py-2.5 rounded-xl bg-ink/5 text-ink font-bold hover:bg-ink/10"
                  >
                    إلغاء
                  </button>
                </div>
              </>
            )}

            {result?.ok && (
              <>
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 grid place-items-center mb-4">
                  <CheckCircle2 size={22} />
                </div>
                <h2 className="text-2xl font-black text-ink mb-2">
                  تم إنشاء الحساب! 🎉
                </h2>
                <p className="text-ink/70 text-sm mb-4">
                  انسخي البيانات تحت وابعتيها للعميلة على واتساب.
                  {result.linkedExtra > 0 && (
                    <>
                      {" "}
                      <span className="text-coral font-bold">
                        + ربطنا {result.linkedExtra} حجز إضافي
                      </span>{" "}
                      بنفس الرقم.
                    </>
                  )}
                </p>

                <CredentialsBox
                  loginUsername={result.loginUsername}
                  password={result.password}
                  clientName={clientName}
                />

                <div className="flex gap-3 justify-start mt-6">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-ink text-white font-bold hover:brightness-110"
                  >
                    خلصت
                  </button>
                </div>
              </>
            )}

            {result && result.ok === false && (
              <>
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 grid place-items-center mb-4">
                  <X size={22} />
                </div>
                <h2 className="text-2xl font-black text-ink mb-2">
                  ما قدرنا نعمل الحساب
                </h2>
                <p className="text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm mb-6">
                  {result.error}
                </p>
                <div className="flex gap-3 justify-start">
                  <button
                    type="button"
                    onClick={() => setResult(null)}
                    className="px-5 py-2.5 rounded-xl bg-coral text-white font-bold hover:brightness-110"
                  >
                    حاولي مرة ثانية
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-ink/5 text-ink font-bold hover:bg-ink/10"
                  >
                    إغلاق
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function CredentialsBox({
  loginUsername,
  password,
  clientName,
}: {
  loginUsername: string;
  password: string;
  clientName: string;
}) {
  const [copied, setCopied] = useState(false);
  const isEmail = loginUsername.includes("@");

  const messageText = `أهلاً ${clientName} 🌸

أنشأنالك حساب على موقع SeeYa عشان تتابعي رحلتك:

🔗 الرابط: https://seeya-website.vercel.app/login
${isEmail ? "📧 الإيميل" : "📱 رقم التلفون"}: ${loginUsername}
🔐 كلمة السر: ${password}

ادخلي وشوفي كل تفاصيل رحلتك ✨`;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="bg-ink/3 rounded-2xl p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-ink/40 font-bold">
              {isEmail ? "الإيميل" : "رقم التلفون (اسم المستخدم)"}
            </div>
            <div
              dir="ltr"
              className="font-mono text-sm font-bold text-ink truncate"
            >
              {loginUsername}
            </div>
          </div>
        </div>
        <div className="h-px bg-ink/8" />
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-ink/40 font-bold">
              كلمة السر
            </div>
            <div dir="ltr" className="font-mono text-sm font-bold text-ink">
              {password}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ink text-white text-xs font-bold hover:brightness-110"
        >
          {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
          <span>{copied ? "نسختي ✓" : "انسخي رسالة الواتساب"}</span>
        </button>
        <a
          href={waLink(messageText)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600"
        >
          <MessageCircle size={13} />
          <span>افتحي واتساب</span>
        </a>
      </div>
    </div>
  );
}
