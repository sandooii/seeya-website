import type { MetadataRoute } from "next";

const SITE_URL = "https://seeya-website.vercel.app";

/**
 * Currently the site is a single-page experience. As we add trip pages
 * (e.g. /trips/[slug]) we should extend this with one entry per trip.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
