import { createFileRoute } from "@tanstack/react-router";
import AdminLayout, { Topbar } from "@/components/AdminLayout";
import ActivityLogPage from "@/components/ActivityLogPage";

export const Route = createFileRoute("/activity")({
  component: ActivityPage,
});

function ActivityPage() {
  return (
    <AdminLayout title="Activity Log">
      <main className="flex-1 min-w-0 flex flex-col">
        <div className="flex-1 min-w-0 p-3 sm:p-4 md:p-6 lg:p-7 space-y-3 sm:space-y-5 pb-6">
          <Topbar />
          <ActivityLogPage />
        </div>
      </main>
    </AdminLayout>
  );
}
