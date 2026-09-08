import { createFileRoute } from "@tanstack/react-router";
import AdminLayout, { Topbar } from "@/components/AdminLayout";
import TheSpaceEditor from "@/components/the-space/TheSpaceEditor";

export const Route = createFileRoute("/the-space")({
  component: TheSpacePage,
});

function TheSpacePage() {
  return (
    <AdminLayout title="The Space">
      <main className="flex-1 min-w-0 flex flex-col">
        <div className="flex-1 min-w-0 p-3 sm:p-4 md:p-6 lg:p-7 space-y-3 sm:space-y-5">
          <Topbar />
          <TheSpaceEditor />
        </div>
      </main>
    </AdminLayout>
  );
}
