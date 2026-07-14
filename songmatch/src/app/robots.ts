import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/matches/", "/status", "/api/"],
    },
    sitemap: "https://songmatch-production-6c95.up.railway.app/sitemap.xml",
  };
}
