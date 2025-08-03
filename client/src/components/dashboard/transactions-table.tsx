import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  FileText,
  Download,
  Eye,
  Edit,
  MessageCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import type { Transaction } from "@shared/schema";

interface Props {
  currency?: string;
}

export default function TransactionsTable({ currency = "₺" }: Props) {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = transactions.slice(startIndex, endIndex);

  return (
    <Card className="shadow-sm border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>آخر المعاملات</CardTitle>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <FileText className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Download className="h-4 w-4" />
            </Button>
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="البحث في المعاملات..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-100 border-0 pr-10 w-64 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-4">
                  <div className="h-4 bg-slate-200 rounded flex-1"></div>
                  <div className="h-4 bg-slate-200 rounded w-20"></div>
                  <div className="h-4 bg-slate-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-800 mb-2">لا توجد معاملات</h3>
            <p className="text-slate-600">
              {search ? "لم يتم العثور على معاملات مطابقة للبحث" : "لا توجد معاملات لعرضها"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">رقم المعاملة</th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">العميل</th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">المبلغ</th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">الحالة</th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">التاريخ</th>
                    <th className="text-right px-6 py-4 text-sm font-medium text-slate-600">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {currentTransactions.map((transaction: Transaction) => (
                    <tr key={transaction.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">
                        {transaction.transactionNumber}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {transaction.customerName || "عميل غير محدد"}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-800">
                        {Number(transaction.total || 0).toLocaleString()} {currency}
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
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-green-600 hover:text-green-800">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-purple-600 hover:text-purple-800">
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  عرض {startIndex + 1}-{Math.min(endIndex, transactions.length)} من أصل {transactions.length} معاملة
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className={currentPage === pageNum ? "bg-blue-600 text-white" : ""}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}

                  {totalPages > 5 && (
                    <>
                      <span className="px-2 text-slate-400">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
