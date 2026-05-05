import type { Metadata } from "next";
import { Cairo, Playfair_Display } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import Loader from "@/components/Loader";
import ScrollAnimations from "@/components/ScrollAnimations";
import WhatsApp from "@/components/WhatsApp";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://seeya-website.vercel.app"),
  title: "SeeYa | رحلات فاخرة للبنات",
  description:
    "رحلات فاخرة مصممة للبنات فقط. مجموعات صغيرة، مرافقة عربية، وتجارب لا تُنسى. انضمي لـ SeeYa وسافري بكلاس.",
  keywords: "رحلات بنات, سفر نسائي, رحلات فاخرة, تايلاند, SeeYa",
  openGraph: {
    title: "SeeYa | رحلات فاخرة للبنات",
    description: "رحلات فاخرة مصممة للبنات فقط.",
    images: [
      {
        url: "https://seeya-website.vercel.app/logo-pink.png",
        width: 1200,
        height: 630,
        alt: "SeeYa - رحلات فاخرة للبنات",
      },
    ],
    locale: "ar_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SeeYa | رحلات فاخرة للبنات",
    description: "رحلات فاخرة مصممة للبنات فقط.",
    images: ["/hero-women.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${cairo.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-ink overflow-x-hidden">
        <SmoothScroll>
          <Loader />
          <ScrollAnimations />
          {children}
          <WhatsApp />
        </SmoothScroll>
      </body>
    </html>
  );
}
