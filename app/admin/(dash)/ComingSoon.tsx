import { Construction } from "lucide-react";

export default function ComingSoon({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="min-h-[60vh] grid place-items-center">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-full bg-coral/10 text-coral grid place-items-center mx-auto mb-6">
          <Construction size={28} />
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-ink mb-3">
          {title}
        </h1>
        {description && (
          <p className="text-ink/60 text-lg leading-relaxed">{description}</p>
        )}
        <div
          className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold"
          style={{
            backgroundColor: "rgba(249,92,107,0.1)",
            color: "#F95C6B",
          }}
        >
          قيد التطوير · قريباً
        </div>
      </div>
    </div>
  );
}
