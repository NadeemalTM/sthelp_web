import type { MetadataRoute } from "next";
import { publicSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = publicSiteUrl();
  return [{ url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 }, { url: `${baseUrl}/assignment-support`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.95 }, { url: `${baseUrl}/student-resources`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 }, { url: `${baseUrl}/place-assignment`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 }, { url: `${baseUrl}/policies`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.55 }, { url: `${baseUrl}/refund-policy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.55 }, { url: `${baseUrl}/privacy-policy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.55 }, { url: `${baseUrl}/terms-and-conditions`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.55 }];
}
