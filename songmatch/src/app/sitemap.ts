import type { MetadataRoute } from "next";

const BASE_URL = "https://songmatch-production-6c95.up.railway.app";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE_URL}/`, changeFrequency: "monthly", priority: 1 },
    { url: `${BASE_URL}/signup`, changeFrequency: "yearly", priority: 0.8 },
    { url: `${BASE_URL}/login`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${BASE_URL}/terms`, changeFrequency: "monthly", priority: 0.6 },
  ];
}
