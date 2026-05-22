import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Trips from "@/components/Trips";
import Countdown from "@/components/Countdown";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";
import { getTripsForPublic, findTripBySlug } from "@/lib/trips";

export default async function Home() {
  // Read trips from the database — RLS allows public read.
  // Server-rendered, revalidated when admin mutates trips
  // (see app/admin/(dash)/trips/actions.ts).
  const trips = await getTripsForPublic();
  const thailand = findTripBySlug(trips, "thailand");

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Countdown trip={thailand} />
        <Trips trips={trips} />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
