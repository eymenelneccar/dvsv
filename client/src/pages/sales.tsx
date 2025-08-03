import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Search, Eye, FileText, QrCode, Printer, Download } from "lucide-react";
import InvoiceForm from "@/components/forms/invoice-form";
import InvoiceViewer from "@/components/invoice/invoice-viewer";
import BarcodeScanner from "@/components/barcode/barcode-scanner";
import type { Transaction, Product } from "@shared/schema";

export default function Sales() {
  const [search, setSearch] = useState("");
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions", search],
    retry: false,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-600";
      case "pending":
        return "bg-yellow-100 text-yellow-600";
      case "cancelled":
        return "bg-red-100 text-red-600";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "مكتملة";
      case "pending":
        return "معلقة";
      case "cancelled":
        return "ملغية";
      default:
        return status;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="إدارة المبيعات"
          subtitle="إدارة الفواتير والمعاملات المالية"
        />
        <main className="flex-1 overflow-auto p-6">
          {/* Header Actions */}
          <div className="flex items-center justify-between mb-6">
            <div className="relative max-w-md">
              <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="البحث في المعاملات..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setShowBarcodeScanner(true)}
              >
                <QrCode className="h-4 w-4 ml-2" />
                مسح باركود
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowInvoiceForm(true)}
              >
                <Plus className="h-4 w-4 ml-2" />
                فاتورة جديدة
              </Button>
            </div>
          </div>

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle>المعاملات الأخيرة</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
                    </div>
                  ))}
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">لا توجد معاملات</h3>
                  <p className="text-slate-600 mb-4">
                    {search ? "لم يتم العثور على معاملات مطابقة للبحث" : "ابدأ بإنشاء فاتورة جديدة"}
                  </p>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setShowInvoiceForm(true)}
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    فاتورة جديدة
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">رقم المعاملة</th>
                        <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">العميل</th>
                        <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">المبلغ</th>
                        <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">نوع الدفع</th>
                        <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">الحالة</th>
                        <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">التاريخ</th>
                        <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {transactions.map((transaction: Transaction) => (
                        <tr key={transaction.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 text-sm font-medium text-slate-800">
                            {transaction.transactionNumber}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {transaction.customerName || "عميل غير محدد"}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-slate-800">
                            {transaction.total || "0"} {transaction.currency === "USD" ? "$" : "₺"}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={transaction.paymentType === "credit" ? "destructive" : "secondary"}>
                              {transaction.paymentType === "credit" ? "دين" : "نقد"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={getStatusColor(transaction.status || "pending")}>
                              {getStatusText(transaction.status || "pending")}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            {transaction.createdAt ? new Date(transaction.createdAt).toLocaleDateString('ar-SA') : "تاريخ غير محدد"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  setSelectedTransaction(transaction);
                                  setShowInvoice(true);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0"
                                onClick={() => {
                                  const printData = {
                                    transactionNumber: transaction.transactionNumber,
                                    customerName: transaction.customerName,
                                    total: transaction.total,
                                    date: new Date(transaction.createdAt || "").toLocaleDateString('ar-SA')
                                  };
                                  
                                  const printWindow = window.open('', '_blank');
                                  if (printWindow) {
                                    printWindow.document.write(`
                                      <html>
                                        <head><title>فاتورة ${printData.transactionNumber}</title></head>
                                        <body style="font-family: Arial; direction: rtl; padding: 20px;">
                                          <h2>فاتورة ${printData.transactionNumber}</h2>
                                          <p>العميل: ${printData.customerName}</p>
                                          <p>المبلغ: ${Number(printData.total).toFixed(2)} ر.س</p>
                                          <p>التاريخ: ${printData.date}</p>
                                          <script>window.print(); window.close();</script>
                                        </body>
                                      </html>
                                    `);
                                    printWindow.document.close();
                                  }
                                }}
                              >
                                <Printer className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <InvoiceForm open={showInvoiceForm} onClose={() => setShowInvoiceForm(false)} />
      
      <InvoiceViewer 
        open={showInvoice}
        onClose={() => {
          setShowInvoice(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
      />

      <Dialog open={showBarcodeScanner} onOpenChange={setShowBarcodeScanner}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>مسح باركود المنتج</DialogTitle>
          </DialogHeader>
          <BarcodeScanner 
            onProductSelect={(product: Product) => {
              // Add product to invoice - this would typically open the invoice form with pre-filled data
              console.log('Selected product:', product);
              setShowBarcodeScanner(false);
              setShowInvoiceForm(true);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
