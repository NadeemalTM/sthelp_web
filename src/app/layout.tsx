import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "StHelp Assignment Support",
    template: "%s | StHelp"
  },
  description: "Submit requirements, track progress, review work, confirm payment and securely receive final files.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "StHelp Assignment Support",
    description: "A clear assignment support workflow from submission to final delivery.",
    images: ["/og.svg"]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
