import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "StHelp Assignment Support",
    template: "%s | StHelp"
  },
  description: "Submit requirements, track progress, review work, confirm payment and securely receive final files.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  alternates: { canonical: "/" },
  keywords: ["assignment support", "academic support", "research guidance", "software development support", "data analysis support", "assignment tracking"],
  authors: [{ name: "StHelp" }],
  robots: { index: true, follow: true },
  openGraph: {
    title: "StHelp Assignment Support",
    description: "A clear assignment support workflow from submission to final delivery.",
    url: "/",
    siteName: "StHelp",
    locale: "en_US",
    type: "website",
    images: [{ url: "/og.svg", alt: "StHelp Assignment Support" }]
  },
  twitter: { card: "summary_large_image", title: "StHelp Assignment Support", description: "A clear assignment support workflow from submission to final delivery.", images: ["/og.svg"] }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
