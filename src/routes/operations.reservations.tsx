import { createFileRoute } from "@tanstack/react-router";
import AdminLayout, { Topbar } from "@/components/AdminLayout";
import ReservationsOps from "@/components/operations/ReservationsOps";

export const Route = createFileRoute("/operations/reservations")({
  component: OperationsReservationsPage,
});

function OperationsReservationsPage() {
  return (
    <AdminLayout title="Reservations">
      <main className="flex-1 min-w-0 flex flex-col">
        <div className="flex-1 min-w-0 p-3 sm:p-4 md:p-6 lg:p-7 space-y-3 sm:space-y-5 pb-6">
          <Topbar />
          <ReservationsOps />
        </div>
      </main>
    </AdminLayout>
  );
}
