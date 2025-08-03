import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertCustomerSchema, type InsertCustomer, type Customer } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface CustomerFormProps {
  open: boolean;
  onClose: () => void;
  customer?: Customer | null;
}

export default function CustomerForm({ open, onClose, customer }: CustomerFormProps) {
  const { toast } = useToast();
  const isEditing = !!customer;
  
  const form = useForm<InsertCustomer>({
    resolver: zodResolver(insertCustomerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      isActive: true,
    },
  });

  // Reset form when customer changes
  React.useEffect(() => {
    if (customer) {
      form.reset({
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        isActive: customer.isActive ?? true,
      });
    } else {
      form.reset({
        name: "",
        email: "",
        phone: "",
        address: "",
        isActive: true,
      });
    }
  }, [customer, form]);

  const customerMutation = useMutation({
    mutationFn: async (data: InsertCustomer) => {
      if (isEditing && customer?.id) {
        return await apiRequest("PUT", `/api/customers/${customer.id}`, data);
      } else {
        return await apiRequest("POST", "/api/customers", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "تم بنجاح",
        description: isEditing ? "تم تحديث العميل بنجاح" : "تم إضافة العميل بنجاح",
      });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: isEditing ? "فشل في تحديث العميل" : "فشل في إضافة العميل",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertCustomer) => {
    customerMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">
            {isEditing ? "تعديل العميل" : "إضافة عميل جديد"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">اسم العميل *</Label>
            <Input
              id="name"
              placeholder="أدخل اسم العميل"
              {...form.register("name")}
              className="text-right"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف</Label>
            <Input
              id="phone"
              placeholder="05xxxxxxxx"
              {...form.register("phone")}
              className="text-right"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">البريد الإلكتروني</Label>
            <Input
              id="email"
              type="email"
              placeholder="customer@example.com"
              {...form.register("email")}
              className="text-right"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">العنوان</Label>
            <Textarea
              id="address"
              placeholder="عنوان العميل..."
              {...form.register("address")}
              className="text-right min-h-[80px]"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={customerMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {customerMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              )}
              {isEditing ? "تحديث العميل" : "إضافة العميل"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}