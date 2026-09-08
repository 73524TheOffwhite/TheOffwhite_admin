import { createFileRoute } from "@tanstack/react-router";
import AdminLayout, { Topbar } from "@/components/AdminLayout";
import GalleryEditor from "@/components/gallery/GalleryEditor";

export const Route = createFileRoute("/gallery")({
  component: GalleryPage,
});

function GalleryPage() {
  return (
    <AdminLayout title="Gallery">
      <main className="flex-1 min-w-0 flex flex-col">
        <div className="flex-1 min-w-0 p-3 sm:p-4 md:p-6 lg:p-7 space-y-3 sm:space-y-5">
          <Topbar />
          <GalleryEditor />
        </div>
      </main>
    </AdminLayout>
  );
}
