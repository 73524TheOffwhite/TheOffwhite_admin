import { createFileRoute } from "@tanstack/react-router";
import AdminLayout, { Topbar } from "@/components/AdminLayout";
import Level5Editor from "@/components/level5/Level5Editor";

export const Route = createFileRoute("/level-5")({
  component: Level5Page,
});

function Level5Page() {
  return (
    <AdminLayout title="Level 5">
      <main className="flex-1 min-w-0 flex flex-col">
        <div className="flex-1 min-w-0 p-3 sm:p-4 md:p-6 lg:p-7 space-y-3 sm:space-y-5">
          <Topbar />
          <Level5Editor />
        </div>
      </main>
    </AdminLayout>
  );
}
