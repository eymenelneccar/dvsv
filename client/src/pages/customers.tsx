import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  User,
  Mail,
  Phone,
  MapPin,
  AlertTriangle,
  CreditCard,
  Users,
  History,
} from "lucide-react";
import CustomerForm from "@/components/forms/customer-form";
import CustomerHistoryModal from "@/components/modals/customer-history-modal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Customer } from "@shared/schema";

export default function Customers() {
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState<Customer | null>(null);
  const { toast } = useToast();

  const { data: customers = [], isLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers", search],
    retry: false,
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/customers/${id}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to delete customer: ${response.status} - ${errorText}`,
        );
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "تم الحذف",
        description: "تم حذف العميل بنجاح",
      });
    },
    onError: (error: any) => {
      console.error("Delete customer error:", error);
      if (isUnauthorizedError(error)) {
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

      let errorMessage = "فشل في حذف العميل";
      if (error.message?.includes("not found")) {
        errorMessage = "العميل غير موجود";
      } else if (error.message?.includes("Failed to delete customer")) {
        errorMessage = "خطأ في قاعدة البيانات أثناء حذف العميل";
      }

      toast({
        title: "خطأ في حذف العميل",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleDelete = async (id: string) => {
    const customer = customers.find((c) => c.id === id);
    const customerName = customer?.name || "هذا العميل";

    if (
      confirm(
        `هل أنت متأكد من حذف ${customerName}؟\n\nهذا الإجراء لا يمكن التراجع عنه.`,
      )
    ) {
      try {
        await deleteCustomerMutation.mutateAsync(id);
      } catch (error) {
        console.error("Delete failed:", error);
      }
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowEditForm(true);
  };

  const handleShowHistory = (customer: Customer) => {
    setHistoryCustomer(customer);
    setShowHistory(true);
  };

  const getDebtStatusColor = (debt: string | number | undefined): string => {
    if (!debt) return "border-yellow-500 text-yellow-500";
    const debtNumber = typeof debt === 'string' ? parseFloat(debt) : debt;
    if (isNaN(debtNumber)) return "border-yellow-500 text-yellow-500";
    
    if (debtNumber >= 5000) {
      return "border-red-500 text-red-500";
    }
    return "border-yellow-500 text-yellow-500";
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title="إدارة العملاء"
          subtitle="إدارة قاعدة بيانات العملاء والتواصل معهم"
        />
        <main className="flex-1 overflow-auto p-6">
          {/* Search and Add */}
          <div className="flex items-center justify-between mb-6">
            <div className="relative max-w-md">
              <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="البحث في العملاء..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة عميل جديد
            </Button>
          </div>

          {/* Customers Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2 mb-4"></div>
                    <div className="h-8 bg-slate-200 rounded w-full"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : customers.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Users className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  لا يوجد عملاء
                </h3>
                <p className="text-slate-600 mb-4">
                  {search
                    ? "لم يتم العثور على عملاء مطابقين للبحث"
                    : "ابدأ بإضافة عملاء إلى قاعدة البيانات"}
                </p>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setShowAddForm(true)}
                >
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة عميل جديد
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customers.map((customer: Customer) => (
                <Card
                  key={customer.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-1">
                          {customer.name}
                        </CardTitle>
                        <Badge
                          variant={customer.isActive ? "default" : "secondary"}
                        >
                          {customer.isActive ? "نشط" : "غير نشط"}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700"
                          onClick={() => handleShowHistory(customer)}
                          title="عرض السجل"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEdit(customer)}
                          title="تعديل العميل"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(customer.id)}
                          disabled={deleteCustomerMutation.isPending}
                          title="حذف العميل"
                        >
                          {deleteCustomerMutation.isPending ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {customer.phone && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="h-4 w-4" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{customer.email}</span>
                        </div>
                      )}
                      {customer.address && (
                        <div className="flex items-start gap-2 text-sm text-slate-600">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">
                            {customer.address}
                          </span>
                        </div>
                      )}
                      {customer.totalDebt &&
                        parseFloat(customer.totalDebt) > 0 && (
                          <div
                            className={`flex items-center gap-2 p-2 rounded-md ${
                              parseFloat(customer.totalDebt) >= 5000
                                ? "bg-red-50 border border-red-200"
                                : "bg-yellow-50 border border-yellow-200"
                            }`}
                          >
                            <AlertTriangle
                              className={`h-4 w-4 ${
                                parseFloat(customer.totalDebt) >= 5000
                                  ? "text-red-500"
                                  : "text-yellow-500"
                              }`}
                            />
                            <div className="text-sm">
                              <span
                                className={
                                  parseFloat(customer.totalDebt) >= 5000
                                    ? "text-red-700 font-semibold"
                                    : "text-yellow-700"
                                }
                              >
                                الدين:{" "}
                                {parseFloat(customer.totalDebt).toFixed(2)} ₺
                              </span>
                              {parseFloat(customer.totalDebt) >= 5000 && (
                                <p className="text-xs text-red-600">
                                  تجاوز الحد المسموح!
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      <div className="pt-2 border-t border-slate-200">
                        <p className="text-xs text-slate-500">
                          انضم في{" "}
                          {new Date(
                            customer.createdAt || "",
                          ).toLocaleDateString("ar-SA")}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      <CustomerForm open={showAddForm} onClose={() => setShowAddForm(false)} />
      <CustomerForm
        open={showEditForm}
        onClose={() => {
          setShowEditForm(false);
          setEditingCustomer(null);
        }}
        customer={editingCustomer}
      />
      <CustomerHistoryModal
        open={showHistory}
        onClose={() => {
          setShowHistory(false);
          setHistoryCustomer(null);
        }}
        customer={historyCustomer}
      />
    </div>
  );
}