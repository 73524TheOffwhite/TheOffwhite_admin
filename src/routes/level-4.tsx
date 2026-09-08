import { createFileRoute } from "@tanstack/react-router";
import AdminLayout, { Topbar } from "@/components/AdminLayout";
import Level4Editor from "@/components/level4/Level4Editor";

export const Route = createFileRoute("/level-4")({
  component: Level4Page,
});

function Level4Page() {
  return (
    <AdminLayout title="Level 4">
      <main className="flex-1 min-w-0 flex flex-col">
        <div className="flex-1 min-w-0 p-3 sm:p-4 md:p-6 lg:p-7 space-y-3 sm:space-y-5">
          <Topbar />
          <Level4Editor />
        </div>
      </main>
    </AdminLayout>
  );
}
