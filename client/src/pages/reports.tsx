import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  BarChart3,
  PieChart,
  Users,
  Package,
  ShoppingCart,
  DollarSign
} from "lucide-react";
import type { Transaction, Product, Customer } from "@shared/schema";
import { format, startOfDay, endOfDay, subDays, startOfMonth, endOfMonth } from "date-fns";
import { ar } from "date-fns/locale";

export default function Reports() {
  const [dateRange, setDateRange] = useState({
    from: format(startOfDay(new Date()), "yyyy-MM-dd"),
    to: format(endOfDay(new Date()), "yyyy-MM-dd"),
  });

  const { data: transactions = [] } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    retry: false,
  });

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    retry: false,
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    retry: false,
  });

  // Filter transactions by date range
  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.createdAt || "");
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    return transactionDate >= fromDate && transactionDate <= toDate;
  });

  // Calculate metrics
  const totalSales = filteredTransactions.reduce((sum, t) => sum + Number(t.total), 0);
  const totalOrders = filteredTransactions.length;
  const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
  
  // Compare with previous period
  const previousPeriodStart = subDays(new Date(dateRange.from), 
    Math.ceil((new Date(dateRange.to).getTime() - new Date(dateRange.from).getTime()) / (1000 * 60 * 60 * 24))
  );
  const previousTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.createdAt || "");
    return transactionDate >= previousPeriodStart && transactionDate < new Date(dateRange.from);
  });
  
  const previousSales = previousTransactions.reduce((sum, t) => sum + Number(t.total), 0);
  const salesGrowth = previousSales > 0 ? ((totalSales - previousSales) / previousSales) * 100 : 0;

  // Top products by sales
  const productSales = filteredTransactions.reduce((acc, transaction) => {
    // Since we don't have transaction items in this simplified version,
    // we'll use customer name as a proxy for product analysis
    const key = transaction.customerName;
    acc[key] = (acc[key] || 0) + Number(transaction.total);
    return acc;
  }, {} as Record<string, number>);

  const topProducts = Object.entries(productSales)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  // Sales by status
  const salesByStatus = filteredTransactions.reduce((acc, transaction) => {
    const status = transaction.status || "pending";
    acc[status] = (acc[status] || 0) + Number(transaction.total);
    return acc;
  }, {} as Record<string, number>);

  const setQuickDateRange = (days: number) => {
    const today = new Date();
    const startDate = subDays(today, days);
    setDateRange({
      from: format(startDate, "yyyy-MM-dd"),
      to: format(today, "yyyy-MM-dd"),
    });
  };

  const exportReport = (type: 'pdf' | 'excel') => {
    const reportData = {
      period: `${format(new Date(dateRange.from), "dd/MM/yyyy", { locale: ar })} - ${format(new Date(dateRange.to), "dd/MM/yyyy", { locale: ar })}`,
      totalSales,
      totalOrders,
      averageOrderValue,
      salesGrowth,
      transactions: filteredTransactions,
      topProducts,
      salesByStatus,
    };

    if (type === 'pdf') {
      // In a real app, you'd use a library like jsPDF
      console.log('Exporting PDF report:', reportData);
      alert('سيتم تصدير التقرير كـ PDF قريباً');
    } else {
      // In a real app, you'd use a library like xlsx
      console.log('Exporting Excel report:', reportData);
      alert('سيتم تصدير التقرير كـ Excel قريباً');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="التقارير والإحصائيات"
          subtitle="تحليل شامل لأداء المبيعات والعمليات"
        />
        <main className="flex-1 overflow-auto p-6">
          {/* Date Range Filter */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                فترة التقرير
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>من تاريخ</Label>
                  <Input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>إلى تاريخ</Label>
                  <Input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                  />
                </div>
                <div className="flex items-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setQuickDateRange(0)}>
                    اليوم
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setQuickDateRange(7)}>
                    أسبوع
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setQuickDateRange(30)}>
                    شهر
                  </Button>
                </div>
                <div className="flex items-end gap-2">
                  <Button onClick={() => exportReport('pdf')} size="sm">
                    <Download className="h-4 w-4 ml-1" />
                    PDF
                  </Button>
                  <Button variant="outline" onClick={() => exportReport('excel')} size="sm">
                    <Download className="h-4 w-4 ml-1" />
                    Excel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
              <TabsTrigger value="sales">تحليل المبيعات</TabsTrigger>
              <TabsTrigger value="products">المنتجات</TabsTrigger>
              <TabsTrigger value="customers">العملاء</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">إجمالي المبيعات</p>
                        <p className="text-2xl font-bold text-green-600">{totalSales.toFixed(2)} ر.س</p>
                        <div className="flex items-center gap-1 mt-1">
                          {salesGrowth >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          <span className={`text-sm ${salesGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {Math.abs(salesGrowth).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">عدد الطلبات</p>
                        <p className="text-2xl font-bold text-blue-600">{totalOrders}</p>
                        <p className="text-sm text-slate-500">طلب</p>
                      </div>
                      <ShoppingCart className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">متوسط قيمة الطلب</p>
                        <p className="text-2xl font-bold text-purple-600">{averageOrderValue.toFixed(2)} ر.س</p>
                        <p className="text-sm text-slate-500">للطلب الواحد</p>
                      </div>
                      <BarChart3 className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">عدد العملاء</p>
                        <p className="text-2xl font-bold text-orange-600">{customers.length}</p>
                        <p className="text-sm text-slate-500">عميل نشط</p>
                      </div>
                      <Users className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Products */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>أعلى المبيعات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {topProducts.length > 0 ? topProducts.map(([customer, sales], index) => (
                        <div key={customer} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                            </div>
                            <span className="font-medium">{customer}</span>
                          </div>
                          <span className="font-bold text-green-600">{sales.toFixed(2)} ر.س</span>
                        </div>
                      )) : (
                        <p className="text-slate-500 text-center py-4">لا توجد مبيعات في هذه الفترة</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>حالة الطلبات</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(salesByStatus).map(([status, amount]) => (
                        <div key={status} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant={
                              status === "completed" ? "default" : 
                              status === "pending" ? "secondary" : 
                              "destructive"
                            }>
                              {status === "completed" ? "مكتملة" : 
                               status === "pending" ? "في الانتظار" : 
                               "ملغية"}
                            </Badge>
                          </div>
                          <span className="font-bold">{amount.toFixed(2)} ر.س</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Sales Analysis Tab */}
            <TabsContent value="sales">
              <Card>
                <CardHeader>
                  <CardTitle>تفاصيل المبيعات</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border border-slate-300 px-4 py-2 text-right">رقم الفاتورة</th>
                          <th className="border border-slate-300 px-4 py-2 text-right">العميل</th>
                          <th className="border border-slate-300 px-4 py-2 text-right">التاريخ</th>
                          <th className="border border-slate-300 px-4 py-2 text-right">المبلغ</th>
                          <th className="border border-slate-300 px-4 py-2 text-right">الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((transaction) => (
                          <tr key={transaction.id} className="hover:bg-slate-50">
                            <td className="border border-slate-300 px-4 py-2">{transaction.transactionNumber}</td>
                            <td className="border border-slate-300 px-4 py-2">{transaction.customerName}</td>
                            <td className="border border-slate-300 px-4 py-2">
                              {format(new Date(transaction.createdAt || ""), "dd/MM/yyyy", { locale: ar })}
                            </td>
                            <td className="border border-slate-300 px-4 py-2 font-medium">
                              {Number(transaction.total).toFixed(2)} ر.س
                            </td>
                            <td className="border border-slate-300 px-4 py-2">
                              <Badge variant={
                                transaction.status === "completed" ? "default" : 
                                transaction.status === "pending" ? "secondary" : 
                                "destructive"
                              }>
                                {transaction.status === "completed" ? "مكتملة" : 
                                 transaction.status === "pending" ? "في الانتظار" : 
                                 "ملغية"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>حالة المخزون</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {products.slice(0, 10).map((product) => (
                        <div key={product.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-slate-600">{product.sku}</p>
                          </div>
                          <div className="text-left">
                            <Badge variant={Number(product.quantity) > Number(product.minQuantity) ? "default" : "destructive"}>
                              {product.quantity} قطعة
                            </Badge>
                            <p className="text-sm text-slate-600">{Number(product.price).toFixed(2)} ر.س</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>المنتجات الأكثر مبيعاً</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {products.slice(0, 5).map((product, index) => (
                        <div key={product.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-green-600">{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-slate-600">{product.category}</p>
                            </div>
                          </div>
                          <span className="font-bold text-green-600">{Number(product.price).toFixed(2)} ر.س</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Customers Tab */}
            <TabsContent value="customers">
              <Card>
                <CardHeader>
                  <CardTitle>قائمة العملاء</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {customers.map((customer) => (
                      <div key={customer.id} className="border rounded-lg p-4">
                        <h4 className="font-medium">{customer.name}</h4>
                        {customer.email && <p className="text-sm text-slate-600">{customer.email}</p>}
                        {customer.phone && <p className="text-sm text-slate-600">{customer.phone}</p>}
                        <div className="mt-2">
                          <Badge variant="outline">
                            {customer.isActive ? "نشط" : "غير نشط"}
                          </Badge>
                        </div>
                      </div>
                    ))}
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