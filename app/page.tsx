import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Trips from "@/components/Trips";
import Countdown from "@/components/Countdown";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Countdown />
        <Trips />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
