import React from "react";
import Sidebar from "@/components/layout/sidebar";
import { useMobile } from "@/hooks/use-mobile";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export default function SidebarLayout({ children }: SidebarLayoutProps) {
  const { isMobile } = useMobile();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar />
        
        <main 
          className={`flex-1 p-6 md:p-8 transition-all duration-300 ${
            isMobile ? "ml-0" : "ml-16 lg:ml-64"
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}