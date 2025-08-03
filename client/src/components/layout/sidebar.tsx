import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Home, 
  Package, 
  ShoppingCart, 
  Users, 
  Truck,
  FileText, 
  Settings,
  LogOut
} from "lucide-react";

const navigationItems = [
  { href: "/", icon: Home, label: "لوحة التحكم" },
  { href: "/inventory", icon: Package, label: "إدارة المخزون" },
  { href: "/sales", icon: ShoppingCart, label: "المبيعات" },
  { href: "/customers", icon: Users, label: "العملاء" },
  { href: "/suppliers", icon: Truck, label: "الموردون" },
  { href: "/reports", icon: FileText, label: "التقارير" },
  { href: "/settings", icon: Settings, label: "الإعدادات" },
];

export default function Sidebar() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();

  return (
    <div className="bg-white shadow-lg w-64 flex-shrink-0 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">ERP Pro</h1>
            <p className="text-sm text-slate-500">نظام إدارة متطور</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-right transition-colors ${
                isActive
                  ? "text-blue-600 bg-blue-50 font-medium"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3 mb-3">
          <img 
            src={(user as any)?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150"} 
            alt="صورة المستخدم" 
            className="w-10 h-10 rounded-full object-cover" 
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">
              {(user as any)?.firstName && (user as any)?.lastName 
                ? `${(user as any).firstName} ${(user as any).lastName}`
                : (user as any)?.username || "مستخدم"}
            </p>
            <p className="text-xs text-slate-500">
              {(user as any)?.role === "admin" ? "مدير النظام" : "موظف"}
            </p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full justify-start gap-2 text-slate-600 hover:text-slate-800"
          onClick={() => {
            localStorage.removeItem("isLoggedIn");
            localStorage.removeItem("username");
            window.location.reload();
          }}
        >
          <LogOut size={16} />
          تسجيل الخروج
        </Button>
      </div>
    </div>
  );
}
