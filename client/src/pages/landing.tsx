import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Package, ShoppingCart, Users, TrendingUp, Shield } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="text-white text-2xl" size={32} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-slate-800 mb-4">ERP Pro</h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            نظام إدارة المؤسسات المتطور - إدارة شاملة للمخزون والمبيعات والعملاء
          </p>
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            onClick={() => window.location.href = '/api/login'}
          >
            تسجيل الدخول
          </Button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-8">
              <Package className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">إدارة المخزون</h3>
              <p className="text-slate-600">
                تتبع شامل للمنتجات والكميات مع تنبيهات للمخزون المنخفض
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-8">
              <ShoppingCart className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">معالجة المبيعات</h3>
              <p className="text-slate-600">
                نظام فواتير متقدم مع حساب الخصومات والضرائب تلقائياً
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-8">
              <Users className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">إدارة العملاء</h3>
              <p className="text-slate-600">
                قاعدة بيانات شاملة للعملاء مع تتبع تاريخ المعاملات
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-8">
              <TrendingUp className="w-12 h-12 text-orange-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">التقارير المتقدمة</h3>
              <p className="text-slate-600">
                تحليلات مفصلة ورسوم بيانية لمساعدتك في اتخاذ القرارات
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-8">
              <Shield className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">الأمان والحماية</h3>
              <p className="text-slate-600">
                نظام صلاحيات متقدم لحماية بياناتك الحساسة
              </p>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardContent className="pt-8">
              <BarChart3 className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">لوحة التحكم</h3>
              <p className="text-slate-600">
                مراقبة شاملة لأداء مؤسستك في مكان واحد
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-slate-600 mb-4">
            جاهز لتطوير إدارة مؤسستك؟
          </p>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
            onClick={() => window.location.href = '/api/login'}
          >
            ابدأ الآن
          </Button>
        </div>
      </div>
    </div>
  );
}
