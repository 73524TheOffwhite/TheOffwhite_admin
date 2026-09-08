import { createFileRoute } from "@tanstack/react-router";
import AdminLayout, { Topbar } from "@/components/AdminLayout";
import MessagesOps from "@/components/operations/MessagesOps";

export const Route = createFileRoute("/operations/messages")({
  component: OperationsMessagesPage,
});

function OperationsMessagesPage() {
  return (
    <AdminLayout title="Messages">
      <main className="flex-1 min-w-0 flex flex-col">
        <div className="flex-1 min-w-0 p-3 sm:p-4 md:p-6 lg:p-7 space-y-3 sm:space-y-5 pb-6">
          <Topbar />
          <MessagesOps />
        </div>
      </main>
    </AdminLayout>
  );
}
