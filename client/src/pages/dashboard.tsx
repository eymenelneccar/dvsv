import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import MetricsCards from "@/components/dashboard/metrics-cards";
import TransactionsTable from "@/components/dashboard/transactions-table";
import QuickStats from "@/components/dashboard/quick-stats";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { currency } = useCurrency(); // ✅ تم إضافة العملة

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "غير مصرح",
        description: "تم تسجيل خروجك. جارٍ تسجيل الدخول مرة أخرى...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">جارٍ التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="لوحة التحكم الرئيسية"
          subtitle={`مرحباً بك في نظام إدارة المؤسسات المتطور (${currency})`} // ✅ استخدام العملة هنا لو حابب
        />
        <main className="flex-1 overflow-auto p-6">
          <MetricsCards currency={currency} /> {/* ✅ تمرير العملة */}
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Chart placeholder */}
            <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-slate-800">تحليل المبيعات الشهرية</h3>
                <select className="bg-slate-100 border-0 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                  <option>آخر 12 شهر</option>
                  <option>آخر 6 أشهر</option>
                  <option>آخر 3 أشهر</option>
                </select>
              </div>
              <div className="h-64 bg-slate-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl text-slate-300 mb-2">📊</div>
                  <p className="text-slate-500">مخطط بياني للمبيعات الشهرية</p>
                </div>
              </div>
            </div>
            
            <QuickStats currency={currency} /> {/* ✅ تمرير العملة */}
          </div>

          <TransactionsTable />
        </main>
      </div>
    </div>
  );
}
