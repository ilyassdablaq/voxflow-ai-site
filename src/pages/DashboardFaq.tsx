import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { FaqContent } from "@/components/faq/FaqContent";

export default function DashboardFaq() {
  return (
    <DashboardShell
      title="FAQ & Documentation"
      description="Find quick answers, setup guidance, and troubleshooting while staying inside your dashboard."
    >
      <FaqContent searchLabel="Search help topics" />
    </DashboardShell>
  );
}
