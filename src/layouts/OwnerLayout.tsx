import { Outlet, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  UtensilsCrossed,
  FileText,
  Settings as SettingsIcon,
  LogOut,
  Menu,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useStore } from "../store/useStore";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function OwnerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut } = useAuthStore();
  const { profile } = useStore();

  const navItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "POS Billing", path: "/pos", icon: ShoppingCart },
    { name: "Menu", path: "/menu", icon: UtensilsCrossed },
    { name: "Orders", path: "/orders", icon: FileText },
    { name: "Settings", path: "/settings", icon: SettingsIcon },
  ];

  return (
    <div className="flex h-screen bg-[#F3F4F6] text-slate-900 overflow-hidden font-sans">
      {/* Mobile sidebar toggle */}
      <div className="md:hidden flex items-center justify-between p-4 bg-emerald-600 text-white z-20 fixed top-0 w-full shadow-md">
        <span className="font-bold text-lg">
          {profile?.restaurantName || "Bill Karo"}
        </span>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white/80 backdrop-blur-md w-64 border-r border-slate-200 fixed md:relative z-20 transition-transform h-full flex flex-col pt-16 md:pt-0",
          sidebarOpen
            ? "translate-x-0 shadow-2xl"
            : "-translate-x-full md:translate-x-0",
        )}
      >
        <div className="p-4 md:p-6 border-b border-slate-200 flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-200 shrink-0">
            {profile?.restaurantName?.charAt(0) || "R"}
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-slate-900 tracking-tight truncate">
              {profile?.restaurantName || "Bill Karo"}
            </h1>
            <p className="text-xs text-slate-500 truncate">Owner Dashboard</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all",
                  isActive
                    ? "bg-emerald-50 text-emerald-600"
                    : "text-slate-500 hover:text-emerald-600 hover:bg-slate-50",
                )
              }
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200">
          <Button
            variant="ghost"
            className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50 font-bold"
            onClick={signOut}
          >
            <LogOut className="w-5 h-5 mr-3 shrink-0" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-16 md:pt-0 pb-16 md:pb-0 bg-[#F3F4F6]">
        <Outlet />
      </main>
    </div>
  );
}
