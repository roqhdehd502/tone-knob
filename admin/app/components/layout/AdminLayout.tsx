import { Outlet } from "react-router";

import { SidebarProvider } from "~/context/sidebar";

import { Sidebar } from "./Sidebar";

export default function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-slate-50">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Outlet />
        </div>
      </div>
    </SidebarProvider>
  );
}
