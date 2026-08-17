import type { MetadataRoute } from "next";
import { publicSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = publicSiteUrl();
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/portal/", "/access", "/api/"] }, sitemap: `${baseUrl.replace(/\/$/, "")}/sitemap.xml` };
}
