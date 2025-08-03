import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  History,
  Receipt,
  Calendar,
  TrendingUp,
  TrendingDown,
  X,
  Printer,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Transaction, Customer } from "@shared/schema";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  customer: Customer | null;
}

function PaymentModal({ open, onClose, transaction, customer }: PaymentModalProps) {
  const [paymentAmount, setPaymentAmount] = useState("");
  const { toast } = useToast();

  const paymentMutation = useMutation({
    mutationFn: async (data: { amount: number; transactionId: string; customerId: string }) => {
      const response = await apiRequest("POST", "/api/payments", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process payment");
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Update the transaction in cache immediately
      queryClient.setQueryData(["/api/transactions"], (oldData: Transaction[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(t => {
          if (t.id === transaction?.id) {
            return {
              ...t,
              total: String(data.remainingAmount || 0),
              status: data.remainingAmount === 0 ? "completed" : "pending"
            };
          }
          return t;
        });
      });

      // Update customer in cache
      queryClient.setQueryData(["/api/customers"], (oldData: Customer[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(c => {
          if (c.id === customer?.id) {
            const currentDebt = parseFloat(String(c.totalDebt || "0"));
            const paymentAmountValue = parseFloat(String(data.amount || 0));
            const newDebt = Math.max(0, currentDebt - paymentAmountValue);
            return {
              ...c,
              totalDebt: String(newDebt)
            };
          }
          return c;
        });
      });

      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "تم السداد بنجاح",
        description: data.remainingAmount === 0 ? "تم سداد الدين بالكامل" : `المتبقي: ${Number(data.remainingAmount || 0).toFixed(2)} ₺`,
      });
      onClose();
      setPaymentAmount("");
    },
    onError: (error: Error) => {
      toast({
        title: "خطأ في السداد",
        description: error.message || "فشل في معالجة الدفع",
        variant: "destructive",
      });
    },
  });

  const handlePayment = () => {
    if (!transaction || !customer || !paymentAmount) return;
    
    const amount = parseFloat(paymentAmount);
    const totalDebt = parseFloat(String(transaction.total || "0"));
    
    if (amount <= 0) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال مبلغ صحيح",
        variant: "destructive",
      });
      return;
    }

    if (amount > totalDebt) {
      toast({
        title: "خطأ",
        description: "المبلغ المدخل أكبر من قيمة الدين",
        variant: "destructive",
      });
      return;
    }

    paymentMutation.mutate({
      amount,
      transactionId: transaction.id,
      customerId: customer.id,
    });
  };

  const remainingDebt = transaction ? parseFloat(String(transaction.total || "0")) - parseFloat(paymentAmount || "0") : 0;

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>سداد الدين</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="font-medium mb-2">تفاصيل المعاملة</h3>
            <p className="text-sm text-slate-600">رقم المعاملة: {transaction.transactionNumber}</p>
            <p className="text-sm text-slate-600">العميل: {customer?.name}</p>
            <p className="text-sm font-medium text-red-600">
              إجمالي الدين: {parseFloat(String(transaction.total || "0")).toFixed(2)} ₺
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-amount">المبلغ المراد دفعه</Label>
            <Input
              id="payment-amount"
              type="number"
              placeholder="0.00"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              step="0.01"
              min="0"
              max={String(transaction.total || "0")}
            />
          </div>

          {paymentAmount && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm">
                <span className="text-blue-700">المتبقي بعد السداد: </span>
                <span className={`font-medium ${remainingDebt === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                  {remainingDebt.toFixed(2)} ₺
                </span>
              </p>
              {remainingDebt === 0 && (
                <p className="text-xs text-green-600 mt-1">✓ سيتم سداد الدين بالكامل</p>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={handlePayment}
              disabled={!paymentAmount || paymentMutation.isPending}
            >
              {paymentMutation.isPending ? "جارٍ المعالجة..." : "تأكيد السداد"}
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={paymentMutation.isPending}
            >
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface CustomerHistoryModalProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export default function CustomerHistoryModal({
  open,
  onClose,
  customer,
}: CustomerHistoryModalProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
    enabled: !!customer && open,
    retry: false,
  });

  const customerTransactions = transactions.filter(
    (t) => t.customerId === customer?.id || t.customerName === customer?.name
  );

  const totalSpent = customerTransactions.reduce(
    (sum, t) => sum + Number(t.total || 0),
    0
  );

  const completedTransactions = customerTransactions.filter(
    (t) => t.status === "completed"
  );

  const pendingTransactions = customerTransactions.filter(
    (t) => t.status === "pending"
  );

  const getStatusColor = (status: string, paymentType: string, transactionType?: string) => {
    if (transactionType === "debt_collection") {
      return "bg-blue-100 text-blue-600";
    }
    if (paymentType === "cash") {
      return "bg-green-100 text-green-600";
    } else if (paymentType === "credit") {
      return "bg-red-100 text-red-600";
    }
    
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

  const getStatusText = (status: string, paymentType: string, transactionType?: string) => {
    if (transactionType === "debt_collection") {
      return "تحصيل دين";
    }
    if (paymentType === "cash") {
      return "مكتملة";
    } else if (paymentType === "credit") {
      return "لم يتم السداد";
    }
    
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

  const printCustomerHistory = (customer: Customer, transactions: Transaction[], totalSpent: number) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const completedTransactions = transactions.filter(t => t.status === "completed");
    const pendingTransactions = transactions.filter(t => t.status === "pending");

    printWindow.document.write(`
      <html>
        <head>
          <title>سجل العميل - ${customer.name}</title>
          <style>
            body { 
              margin: 0; 
              padding: 20px; 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              direction: rtl;
              font-size: 14px;
            }
            .header {
              border-bottom: 2px solid #2563eb;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .customer-name {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 10px;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              margin-bottom: 30px;
            }
            .summary-card {
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 15px;
              background: #f8fafc;
            }
            .summary-label {
              color: #64748b;
              font-size: 12px;
              margin-bottom: 5px;
            }
            .summary-value {
              font-size: 18px;
              font-weight: bold;
            }
            .debt-value {
              color: #ea580c;
            }
            .total-value {
              color: #16a34a;
            }
            .transactions-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            .transactions-table th,
            .transactions-table td {
              border: 1px solid #e2e8f0;
              padding: 12px;
              text-align: right;
            }
            .transactions-table th {
              background-color: #f1f5f9;
              font-weight: bold;
            }
            .status-completed { color: #16a34a; }
            .status-pending { color: #ca8a04; }
            .status-cancelled { color: #dc2626; }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="customer-name">سجل العميل - ${customer.name}</div>
            <div>تاريخ الطباعة: ${new Date().toLocaleDateString('en-GB')}</div>
          </div>

          <div class="summary-grid">
            <div class="summary-card">
              <div class="summary-label">إجمالي المعاملات</div>
              <div class="summary-value">${transactions.length}</div>
            </div>
            <div class="summary-card">
              <div class="summary-label">إجمالي المبالغ</div>
              <div class="summary-value total-value">${totalSpent.toFixed(2)} ₺</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 5px;">
                مكتملة: ${completedTransactions.length} | معلقة: ${pendingTransactions.length}
              </div>
            </div>
            <div class="summary-card">
              <div class="summary-label">الدين الحالي</div>
              <div class="summary-value debt-value">${Number(customer.totalDebt || 0).toFixed(2)} ₺</div>
            </div>
          </div>

          <h3>تفاصيل المعاملات</h3>
          <table class="transactions-table">
            <thead>
              <tr>
                <th>رقم المعاملة</th>
                <th>التاريخ</th>
                <th>نوع الدفع</th>
                <th>المبلغ</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.map(transaction => `
                <tr>
                  <td>${transaction.transactionNumber}</td>
                  <td>${new Date(transaction.createdAt || "").toLocaleDateString("en-GB", {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</td>
                  <td>${transaction.paymentType === 'cash' ? 'نقدي' : 'دين'}</td>
                  <td>${Number(transaction.total || 0).toFixed(2)} ₺</td>
                  <td class="status-${transaction.paymentType === 'cash' ? 'completed' : 'pending'}">
                    ${transaction.paymentType === 'cash' ? 'مكتملة' : 'لم يتم السداد'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 100);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">
              سجل العميل - {customer.name}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => printCustomerHistory(customer, customerTransactions, totalSpent)}
                className="flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                طباعة
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Receipt className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">إجمالي المعاملات</p>
                    <p className="text-lg font-semibold">
                      {customerTransactions.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">إجمالي المبالغ</p>
                    <p className="text-lg font-semibold text-green-600">
                      {totalSpent.toFixed(2)} ₺
                    </p>
                    <p className="text-xs text-slate-500">
                      مكتملة: {completedTransactions.length} | معلقة: {pendingTransactions.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <TrendingDown className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">الدين الحالي</p>
                    <p className="text-lg font-semibold text-orange-600">
                      {Number(customer.totalDebt || 0).toFixed(2)} ₺
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-medium mb-4">سجل المعاملات</h3>
            <TransactionsList
              transactions={customerTransactions}
              isLoading={isLoading}
              getStatusColor={getStatusColor}
              getStatusText={getStatusText}
              onPayClick={(transaction) => {
                setSelectedTransaction(transaction);
                setShowPaymentModal(true);
              }}
            />
          </div>
        </div>
      </DialogContent>
      
      <PaymentModal
        open={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
        customer={customer}
      />
    </Dialog>
  );
}

interface TransactionsListProps {
  transactions: Transaction[];
  isLoading: boolean;
  getStatusColor: (status: string, paymentType: string, transactionType?: string) => string;
  getStatusText: (status: string, paymentType: string, transactionType?: string) => string;
  onPayClick: (transaction: Transaction) => void;
}

function TransactionsList({
  transactions,
  isLoading,
  getStatusColor,
  getStatusText,
  onPayClick,
}: TransactionsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <History className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            لا توجد معاملات
          </h3>
          <p className="text-slate-600">لا توجد معاملات لهذا العميل في هذه الفئة</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <Card key={transaction.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Receipt className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">
                      معاملة #{transaction.transactionNumber}
                    </p>
                    <p className="text-sm text-slate-600 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(
                        transaction.createdAt || ""
                      ).toLocaleDateString("en-GB", {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    <p className="text-xs text-slate-500">
                      نوع المعاملة: {
                        (transaction as any).transactionType === 'debt_collection' 
                          ? 'تحصيل دين' 
                          : (transaction.paymentType === 'cash' ? 'مبيعات نقدي' : 'مبيعات آجل')
                      }
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={`font-semibold text-lg ${
                    (transaction as any).transactionType === "debt_collection" 
                      ? "text-blue-600" 
                      : "text-green-600"
                  }`}>
                    {Number(String(transaction.total || "0")).toFixed(2)} ₺
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={getStatusColor(
                        transaction.status || "pending", 
                        transaction.paymentType || "cash",
                        (transaction as any).transactionType
                      )}
                    >
                      {getStatusText(
                        transaction.status || "pending", 
                        transaction.paymentType || "cash",
                        (transaction as any).transactionType
                      )}
                    </Badge>
                    {transaction.paymentType === "credit" && (transaction as any).transactionType !== "debt_collection" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        onClick={() => onPayClick(transaction)}
                      >
                        ادفع
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}