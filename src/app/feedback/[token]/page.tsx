import { FeedbackClient } from "./FeedbackClient";

export const metadata = { title: "Share feedback" };
export const dynamic = "force-dynamic";

export default async function FeedbackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <FeedbackClient token={token} />;
}
