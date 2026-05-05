"use client";

import { Mail, Phone } from "lucide-react";
import Logo from "./Logo";

function Instagram({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

const navLinks = [
  { label: "رحلاتنا", href: "#trips" },
  { label: "أسئلتكِ", href: "#faq" },
];

const WHATSAPP_INTL = "9720544880123";
const WHATSAPP_DISPLAY = "054-488-0123";
const INSTAGRAM_HANDLE = "seeyaa.ar";
const INSTAGRAM_URL = "https://instagram.com/seeyaa.ar";
const EMAIL = "seeyaa.ar@gmail.com";

export default function Footer() {
  return (
    <footer className="bg-ink text-white pt-16 pb-8 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
          <div className="flex flex-col items-start text-right">
            <Logo size={64} variant="white" />
            <p className="mt-4 text-white/65 max-w-xs leading-relaxed text-right">
              مساحة لعاشقات الفخامة في عالم السفر. وجهات فريدة، تجارب حقيقية،
              وصداقات بتعيش معك طول العمر.
            </p>
            <p
              className="mt-3 text-coral-soft font-display italic text-lg text-right"
              dir="ltr"
            >
              catch flights, not feelings.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold tracking-widest uppercase text-white/50 mb-4">
              SeeYa
            </h4>
            <ul className="space-y-3">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className="text-white/85 hover:text-coral transition-colors"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold tracking-widest uppercase text-white/50 mb-4">
              تواصلي معنا
            </h4>
            <ul className="space-y-3 text-white/85">
              <li>
                <a
                  href={`https://wa.me/${WHATSAPP_INTL}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 hover:text-coral transition-colors"
                >
                  <span className="grid place-items-center w-8 h-8 rounded-full bg-white/10">
                    <Phone size={14} />
                  </span>
                  <span dir="ltr" className="font-semibold tabular-nums">
                    {WHATSAPP_DISPLAY}
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 hover:text-coral transition-colors"
                >
                  <span className="grid place-items-center w-8 h-8 rounded-full bg-white/10">
                    <Instagram size={14} />
                  </span>
                  <span dir="ltr" className="font-semibold">
                    {INSTAGRAM_HANDLE}
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${EMAIL}`}
                  className="inline-flex items-center gap-2.5 hover:text-coral transition-colors"
                >
                  <span className="grid place-items-center w-8 h-8 rounded-full bg-white/10">
                    <Mail size={14} />
                  </span>
                  <span dir="ltr">{EMAIL}</span>
                </a>
              </li>
              <li className="pt-1">
                <a
                  href={`https://wa.me/${WHATSAPP_INTL}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  dir="ltr"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-bold hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: "#F95C6B" }}
                >
                  SeeYa WhatsApp
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white" aria-hidden>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.522 5.855L.057 23.882l6.204-1.427A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.894a9.877 9.877 0 01-5.031-1.378l-.36-.214-3.732.858.882-3.63-.235-.374A9.861 9.861 0 012.106 12C2.106 6.58 6.58 2.106 12 2.106c5.421 0 9.894 4.474 9.894 9.894 0 5.421-4.473 9.894-9.894 9.894z" />
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-white/55">
          <p>© {new Date().getFullYear()} SeeYa. كل الحقوق محفوظة.</p>
          <p dir="ltr" className="font-display italic">
            made with ♥ for the girls.
          </p>
        </div>
      </div>
    </footer>
  );
}
