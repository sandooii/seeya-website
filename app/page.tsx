import Navbar from "@/components/Navbar";
import NavAccountSlot from "@/components/NavAccountSlot";
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
  //
  // Zanzibar is filtered out here (not deleted from the DB) so that
  // clients who booked the Zanzibar trip still see their record in
  // /account, but the public homepage doesn't advertise a trip we've
  // stopped selling.
  const allTrips = await getTripsForPublic();
  const trips = allTrips.filter((t) => t.id !== "zanzibar");
  const thailand = findTripBySlug(trips, "thailand");

  return (
    <>
      <Navbar
        accountSlotLight={<NavAccountSlot dark={false} />}
        accountSlotDark={<NavAccountSlot dark={true} />}
      />
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
