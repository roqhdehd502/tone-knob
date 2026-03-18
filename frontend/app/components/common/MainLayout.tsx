import { useState } from "react";
import { Outlet } from "react-router";

import { Footer } from "./Footer";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";
import { TutorialOverlay } from "./TutorialOverlay";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-gray-950">
      <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 lg:pl-60">
        <div className="animate-fade-in px-5 py-6 pb-20 md:px-8 lg:px-10 lg:pb-6 xl:px-14">
          <Outlet />
        </div>
      </main>
      <Footer />
      <MobileNav />
      <TutorialOverlay />
    </div>
  );
}
