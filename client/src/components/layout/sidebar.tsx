import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/use-mobile";
import {
  LayoutDashboard,
  FilePlus,
  FileQuestion,
  Users,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { isMobile } = useMobile();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Automatically collapse sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true);
      setIsMobileOpen(false);
    }
  }, [isMobile]);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  const toggleMobileMenu = () => {
    setIsMobileOpen((prev) => !prev);
  };

  // Close mobile menu when navigating
  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) {
      setIsMobileOpen(false);
    }
  };

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      path: "/admin",
    },
    {
      title: "Create Quiz",
      icon: FilePlus,
      path: "/admin/create-quiz",
    },
    {
      title: "Manage Quizzes",
      icon: FileQuestion,
      path: "/admin/manage-quizzes",
    },
    {
      title: "User Results",
      icon: Users,
      path: "/admin/user-results",
    },
  ];

  // Mobile menu toggle button (fixed to the top-left)
  const mobileMenuButton = isMobile && (
    <button
      onClick={toggleMobileMenu}
      className="fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-md text-gray-700"
      aria-label={isMobileOpen ? "Close menu" : "Open menu"}>
      {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
    </button>
  );

  // Determine sidebar width based on state
  const sidebarWidth = isCollapsed ? "w-16" : "w-64";

  // Determine if sidebar should be shown on mobile
  const sidebarVisibility =
    isMobile && !isMobileOpen ? "transform -translate-x-full" : "";

  return (
    <>
      {mobileMenuButton}

      <aside
        className={cn(
          `${sidebarWidth} bg-white shadow-md h-screen fixed left-0 transition-all duration-300 z-40`,
          sidebarVisibility,
          className,
        )}>
        <div
          className={cn(
            "border-b border-gray-200 flex items-center",
            isCollapsed ? "justify-center p-3" : "justify-between p-4",
          )}>
          {!isCollapsed && (
            <div>
              <h2 className="text-xl font-bold text-primary">Quiz Builder</h2>
              <p className="text-sm text-gray-600">Admin Dashboard</p>
            </div>
          )}

          {isCollapsed && (
            <div className="text-primary">
              <FilePlus className="h-6 w-6" />
            </div>
          )}

          {!isMobile && (
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-auto"
              onClick={toggleSidebar}>
              {isCollapsed ? (
                <ChevronRight size={18} />
              ) : (
                <ChevronLeft size={18} />
              )}
            </Button>
          )}
        </div>

        <nav className={isCollapsed ? "p-2" : "p-4"}>
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full",
                    isCollapsed ? "justify-center px-2" : "justify-start",
                    location === item.path &&
                      "bg-blue-50 text-primary font-medium",
                  )}
                  onClick={() => handleNavigate(item.path)}
                  title={isCollapsed ? item.title : undefined}>
                  <item.icon
                    className={cn("h-5 w-5", !isCollapsed && "mr-3")}
                  />
                  {!isCollapsed && item.title}
                </Button>
              </li>
            ))}
          </ul>
        </nav>

        <div
          className={cn(
            "absolute bottom-0 w-full border-t border-gray-200",
            isCollapsed ? "p-2" : "p-4",
          )}>
          <Button
            variant="ghost"
            className={cn(
              "w-full text-gray-700 hover:bg-gray-100",
              isCollapsed ? "justify-center p-2" : "justify-start",
            )}
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            title={isCollapsed ? "Logout" : undefined}>
            <LogOut className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
            {!isCollapsed && "Logout"}
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile menu */}
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleMobileMenu}
        />
      )}
    </>
  );
}
