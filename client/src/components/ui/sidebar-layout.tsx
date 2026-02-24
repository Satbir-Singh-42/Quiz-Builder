import React, { useState } from "react";
import Sidebar from "@/components/layout/sidebar";
import { useMobile } from "@/hooks/use-mobile";
import { Menu } from "lucide-react";
import { APP_NAME } from "@shared/constants";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const { isMobile } = useMobile();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const contentMargin = isMobile
    ? "ml-0 pt-14"
    : isCollapsed
      ? "ml-16"
      : "ml-64";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile top bar */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-30 flex items-center px-4 shadow-sm">
          <button
            onClick={() => setIsMobileOpen(true)}
            className="p-2 -ml-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Open menu">
            <Menu size={22} />
          </button>
          <span className="ml-2 text-lg font-bold text-primary">
            {APP_NAME}
          </span>
        </div>
      )}

      <div className="flex">
        <Sidebar
          isCollapsed={isCollapsed}
          onCollapsedChange={setIsCollapsed}
          isMobileOpen={isMobileOpen}
          onMobileClose={() => setIsMobileOpen(false)}
        />

        <main
          className={`flex-1 min-w-0 p-4 sm:p-6 md:p-8 transition-all duration-300 ${contentMargin}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
