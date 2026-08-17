import { getServiceSupabase } from "@/lib/supabase-server";

type Database = ReturnType<typeof getServiceSupabase>;
type ActivityInput = {
  assignmentId: string;
  actor: "client" | "admin" | "system";
  visibility: "admin" | "client" | "both";
  eventType: string;
  summary: string;
};

export async function recordAssignmentActivity(db: Database, input: ActivityInput) {
  const { error } = await db.from("assignment_activity").insert({
    assignment_id: input.assignmentId,
    actor: input.actor,
    visibility: input.visibility,
    event_type: input.eventType,
    summary: input.summary
  });
  if (error) throw error;
}
