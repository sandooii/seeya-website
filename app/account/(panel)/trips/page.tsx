import { redirect } from "next/navigation";

/**
 * Phase 11.1 — /account became the trips landing, so this index
 * route just bounces. The companion detail page at
 * `/account/trips/[id]` is unchanged.
 */
export default function MyTripsRedirect() {
  redirect("/account");
}
