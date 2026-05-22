"use client";

import { useState, useTransition } from "react";
import { Loader2, KeyRound, CheckCircle2 } from "lucide-react";
import { resetClientPasswordToPhone } from "./actions";

export default function ResetPasswordButton({
  clientId,
  phone,
}: {
  clientId: string;
  phone: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReset = () => {
    if (
      !confirm(
        "إعادة تعيين كلمة السر لتساوي رقم تلفون العميلة الحالي؟ بعدها العميلة بتقدر تدخل بإيميلها + رقمها.",
      )
    ) {
      return;
    }
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await resetClientPasswordToPhone(clientId);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(result.password ?? phone ?? "تم");
    });
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleReset}
        disabled={pending || !phone}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ink/5 text-ink text-sm font-bold hover:bg-coral/10 hover:text-coral transition-colors disabled:opacity-50"
      >
        {pending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <KeyRound size={14} />
        )}
        <span>
          {pending ? "جاري التعيين..." : "إعادة تعيين كلمة السر = رقم التلفون"}
        </span>
      </button>
      {success && (
        <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          <CheckCircle2 size={14} />
          <span>
            تم — كلمة السر الجديدة:{" "}
            <code dir="ltr" className="font-mono">
              {success}
            </code>
          </span>
        </div>
      )}
      {error && (
        <p className="text-xs font-bold text-red-600">{error}</p>
      )}
    </div>
  );
}
