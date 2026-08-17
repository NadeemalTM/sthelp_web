import { PortalClient } from "./PortalClient";

export const metadata = { title: "Client portal", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PortalPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PortalClient token={token} />;
}
