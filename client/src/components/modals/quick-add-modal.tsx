import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Package, Users, ShoppingCart } from "lucide-react";
import ProductForm from "@/components/forms/product-form";
import CustomerForm from "@/components/forms/customer-form";
import InvoiceForm from "@/components/forms/invoice-form";

interface QuickAddModalProps {
  open: boolean;
  onClose: () => void;
}

export default function QuickAddModal({ open, onClose }: QuickAddModalProps) {
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);

  const quickActions = [
    {
      icon: Package,
      label: "إضافة منتج جديد",
      onClick: () => {
        onClose();
        setShowProductForm(true);
      },
    },
    {
      icon: Users,
      label: "إضافة عميل جديد",
      onClick: () => {
        onClose();
        setShowCustomerForm(true);
      },
    },
    {
      icon: ShoppingCart,
      label: "إنشاء فاتورة جديدة",
      onClick: () => {
        onClose();
        setShowInvoiceForm(true);
      },
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">إضافة سريع</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start gap-3 h-12 text-right"
                onClick={action.onClick}
              >
                <Icon className="h-5 w-5 text-blue-600" />
                {action.label}
              </Button>
            );
          })}
        </div>
      </DialogContent>

      <ProductForm open={showProductForm} onClose={() => setShowProductForm(false)} />
      <CustomerForm open={showCustomerForm} onClose={() => setShowCustomerForm(false)} />
      <InvoiceForm open={showInvoiceForm} onClose={() => setShowInvoiceForm(false)} />
    </Dialog>
  );
}
