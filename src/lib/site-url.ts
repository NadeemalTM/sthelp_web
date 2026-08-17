export function publicSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = new URL(configured);

  // The apex domain redirects permanently to www in production. Keep every
  // canonical URL, sitemap entry and generated client link on that same host.
  if (url.hostname === "sthelp.edu.lk") url.hostname = "www.sthelp.edu.lk";
  return url.origin;
}
