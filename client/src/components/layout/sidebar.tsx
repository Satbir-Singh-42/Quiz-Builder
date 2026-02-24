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
  X,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { APP_NAME, APP_TAGLINE, SIDEBAR_MENU } from "@shared/constants";

interface SidebarProps {
  className?: string;
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({
  className,
  isCollapsed: controlledCollapsed,
  onCollapsedChange,
  isMobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { isMobile } = useMobile();
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  // Use controlled state if provided, otherwise internal
  const isCollapsed = controlledCollapsed ?? internalCollapsed;
  const setIsCollapsed = (value: boolean) => {
    setInternalCollapsed(value);
    onCollapsedChange?.(value);
  };

  // Automatically collapse sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true);
    }
  }, [isMobile]);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Close mobile menu when navigating
  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) {
      onMobileClose?.();
    }
  };

  const iconMap: Record<string, LucideIcon> = {
    LayoutDashboard,
    FilePlus,
    FileQuestion,
    Users,
  };

  const menuItems = SIDEBAR_MENU.map((item) => ({
    ...item,
    icon: iconMap[item.iconName] || LayoutDashboard,
  }));

  // On mobile: sidebar is a slide-out drawer controlled by parent
  // On desktop: sidebar is a fixed panel with collapse/expand
  const sidebarWidth = isMobile ? "w-72" : isCollapsed ? "w-16" : "w-64";
  const sidebarTransform =
    isMobile && !isMobileOpen ? "-translate-x-full" : "translate-x-0";

  return (
    <>
      <aside
        className={cn(
          `${sidebarWidth} bg-white shadow-md h-screen fixed left-0 top-0 transition-all duration-300 z-40 flex flex-col`,
          sidebarTransform,
          className,
        )}>
        {/* Header */}
        <div
          className={cn(
            "border-b border-gray-200 flex items-center shrink-0",
            isCollapsed && !isMobile
              ? "justify-center p-3"
              : "justify-between p-4",
          )}>
          {(!isCollapsed || isMobile) && (
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-primary truncate">
                {APP_NAME}
              </h2>
              <p className="text-sm text-gray-600 truncate">{APP_TAGLINE}</p>
            </div>
          )}

          {isCollapsed && !isMobile && (
            <div className="text-primary">
              <FilePlus className="h-6 w-6" />
            </div>
          )}

          {isMobile ? (
            <button
              onClick={onMobileClose}
              className="p-2 rounded-md text-gray-500 hover:bg-gray-100 shrink-0"
              aria-label="Close menu">
              <X size={20} />
            </button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="p-1 h-auto shrink-0"
              onClick={toggleSidebar}>
              {isCollapsed ? (
                <ChevronRight size={18} />
              ) : (
                <ChevronLeft size={18} />
              )}
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav
          className={cn(
            "flex-1 overflow-y-auto",
            isCollapsed && !isMobile ? "p-2" : "p-4",
          )}>
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full",
                    isCollapsed && !isMobile
                      ? "justify-center px-2"
                      : "justify-start",
                    location === item.path &&
                      "bg-blue-50 text-primary font-medium",
                  )}
                  onClick={() => handleNavigate(item.path)}
                  title={isCollapsed && !isMobile ? item.title : undefined}>
                  <item.icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      (!isCollapsed || isMobile) && "mr-3",
                    )}
                  />
                  {(!isCollapsed || isMobile) && (
                    <span className="truncate">{item.title}</span>
                  )}
                </Button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div
          className={cn(
            "border-t border-gray-200 shrink-0",
            isCollapsed && !isMobile ? "p-2" : "p-4",
          )}>
          {(!isCollapsed || isMobile) && user && (
            <div className="mb-3 px-2">
              <p className="text-sm font-medium text-gray-800 truncate">
                {user.username}
              </p>
              <p className="text-xs text-gray-500">Administrator</p>
            </div>
          )}
          <Button
            variant="outline"
            className={cn(
              "w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700",
              isCollapsed && !isMobile ? "justify-center p-2" : "justify-start",
            )}
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            title={isCollapsed && !isMobile ? "Logout" : undefined}>
            <LogOut
              className={cn(
                "h-5 w-5 shrink-0",
                (!isCollapsed || isMobile) && "mr-3",
              )}
            />
            {(!isCollapsed || isMobile) && "Logout"}
          </Button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobile && isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={onMobileClose}
        />
      )}
    </>
  );
}
