import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCurrency } from "@/hooks/useCurrency";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Settings2,
  Building,
  Bell,
  Shield,
  Database,
  User
} from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { currency, setCurrency } = useCurrency();

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    lowStock: true,
    newOrders: true,
  });

  const [companyInfo, setCompanyInfo] = useState({
    name: "شركة النظام المتقدم للتجارة",
    address: "الرياض، المملكة العربية السعودية",
    phone: "+966 11 123 4567",
    email: "info@company.com",
    taxNumber: "123456789012345",
    website: "www.company.com",
  });

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="الإعدادات" subtitle="إدارة إعدادات النظام والحساب" />
        <main className="flex-1 overflow-auto p-6">
          <Tabs defaultValue="company" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="company" className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                معلومات الشركة
              </TabsTrigger>
              <TabsTrigger value="account" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                الحساب الشخصي
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                الإشعارات
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                الأمان
              </TabsTrigger>
              <TabsTrigger value="system" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                النظام
              </TabsTrigger>
            </TabsList>

            {/* تبويب النظام */}
            <TabsContent value="system">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    إعدادات النظام
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    {/* اللغة والمنطقة */}
                    <div>
                      <h4 className="font-medium mb-2">اللغة والمنطقة</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>اللغة</Label>
                          <Input value="العربية" readOnly className="text-right" />
                        </div>
                        <div className="space-y-2">
                          <Label>المنطقة الزمنية</Label>
                          <Input value="آسيا/الرياض" readOnly className="text-right" />
                        </div>
                      </div>
                    </div>

                    {/* اختيار العملة */}
                    <div>
                      <h4 className="font-medium mb-2">العملة</h4>
                      <div className="space-y-2">
                        <Label>اختر العملة</Label>
                        <select
                          value={currency}
                          onChange={(e) => setCurrency(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="SAR">ريال سعودي (ر.س)</option>
                          <option value="USD">دولار أمريكي ($)</option>
                          <option value="TRY">ليرة تركية (₺)</option>
                          <option value="AED">درهم إماراتي (د.إ)</option>
                          <option value="EUR">يورو (€)</option>
                        </select>
                      </div>
                    </div>

                    <Separator />

                    {/* النسخ الاحتياطي */}
                    <div>
                      <h4 className="font-medium mb-2">النسخ الاحتياطي</h4>
                      <p className="text-sm text-slate-600 mb-3">آخر نسخة احتياطية: اليوم 12:00 ص</p>
                      <div className="flex gap-3">
                        <Button variant="outline">إنشاء نسخة احتياطية الآن</Button>
                        <Button variant="outline">استعادة من نسخة احتياطية</Button>
                      </div>
                    </div>

                    <Separator />

                    {/* المنطقة الخطرة */}
                    <div>
                      <h4 className="font-medium mb-2 text-red-600">المنطقة الخطرة</h4>
                      <p className="text-sm text-slate-600 mb-3">إعادة تعيين النظام أو حذف جميع البيانات</p>
                      <div className="flex gap-3">
                        <Button variant="outline" className="text-red-600 hover:text-red-700">
                          إعادة تعيين النظام
                        </Button>
                        <Button variant="outline" className="text-red-600 hover:text-red-700">
                          حذف جميع البيانات
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
