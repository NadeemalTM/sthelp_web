import { HumanizerAdminManager } from "./HumanizerAdminManager";

export const metadata = { title: "AI Humanizer · Plans & Subscribed Users" };
export const dynamic = "force-dynamic";

export default function HumanizerAdminPage() {
  return <HumanizerAdminManager />;
}

