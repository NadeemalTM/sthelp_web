import { AssignmentManager } from "./AssignmentManager";

export const metadata = { title: "Manage assignment" };
export const dynamic = "force-dynamic";

export default async function AssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AssignmentManager assignmentId={id}/>;
}
