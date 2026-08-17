import type { Metadata } from "next";
import "./globals.css";
import { publicSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  title: {
    default: "Assignment Support in Sri Lanka",
    template: "%s | StHelp"
  },
  description: "StHelp offers online assignment support, research guidance, software project support and data-analysis help for students in Sri Lanka.",
  metadataBase: new URL(publicSiteUrl()),
  alternates: { canonical: "/" },
  keywords: ["assignment support Sri Lanka", "assignment help Sri Lanka", "academic support Sri Lanka", "research guidance", "software project support", "data analysis support", "assignment tracking"],
  authors: [{ name: "StHelp" }],
  robots: { index: true, follow: true },
  openGraph: {
    title: "Assignment Support in Sri Lanka | StHelp",
    description: "Online academic support, research guidance, software project support and private assignment tracking.",
    url: "/",
    siteName: "StHelp",
    locale: "en_US",
    type: "website",
    images: [{ url: "/og.svg", alt: "StHelp Assignment Support in Sri Lanka" }]
  },
  twitter: { card: "summary_large_image", title: "Assignment Support in Sri Lanka | StHelp", description: "Online academic support, research guidance and private assignment tracking.", images: ["/og.svg"] }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
