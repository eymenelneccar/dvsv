import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type InsertTransaction, type Customer, type Product } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Plus, Trash2, Calculator, Receipt, Search, QrCode, X } from "lucide-react";
import { z } from "zod";

interface InvoiceFormProps {
  open: boolean;
  onClose: () => void;
}

const invoiceSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().min(1, "اسم العميل مطلوب"),
  discount: z.string().default("0"),
  paymentType: z.enum(["cash", "credit"]).default("cash"),
  currency: z.enum(["TRY", "USD"]).default("TRY"),
  items: z.array(z.object({
    productId: z.string().min(1, "المنتج مطلوب"),
    productName: z.string().min(1, "اسم المنتج مطلوب"),
    quantity: z.number().min(1, "الكمية يجب أن تكون أكبر من 0"),
    price: z.string().min(1, "السعر مطلوب"),
    total: z.string(),
  })).min(1, "يجب إضافة منتج واحد على الأقل"),
});

type InvoiceFormData = z.infer<typeof invoiceSchema>;

export default function InvoiceForm({ open, onClose }: InvoiceFormProps) {
  const { toast } = useToast();
  const [subtotal, setSubtotal] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [showBarcodeInput, setShowBarcodeInput] = useState(false);

  // Fetch products and customers
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    retry: false,
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    retry: false,
  });

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerName: "",
      customerId: "",
      discount: "0",
      paymentType: "cash",
      currency: "TRY",
      items: [{ productId: "", productName: "", quantity: 1, price: "0", total: "0" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const watchedItems = form.watch("items");
  const watchedDiscount = form.watch("discount");

  // Calculate totals
  useEffect(() => {
    const itemsTotal = watchedItems.reduce((sum, item) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;
      return sum + (price * quantity);
    }, 0);

    const discount = Number(watchedDiscount) || 0;
    const total = Math.max(0, itemsTotal - discount);

    setSubtotal(itemsTotal);
    setFinalTotal(total);

    // Update item totals
    watchedItems.forEach((item, index) => {
      const price = Number(item.price) || 0;
      const quantity = Number(item.quantity) || 0;
      const itemTotal = price * quantity;
      form.setValue(`items.${index}.total`, itemTotal.toString());
    });
  }, [watchedItems, watchedDiscount, form]);

  const createInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      console.log("Creating invoice with data:", data);

      // Recalculate totals to ensure accuracy
      const itemsTotal = data.items.reduce((sum, item) => {
        return sum + (Number(item.price) * item.quantity);
      }, 0);
      
      const discountAmount = Number(data.discount) || 0;
      const calculatedTotal = itemsTotal - discountAmount;

      const transactionData: InsertTransaction = {
        customerId: data.customerId || null,
        customerName: data.customerName,
        total: calculatedTotal.toString(),
        discount: data.discount,
        tax: "0",
        paymentType: data.paymentType,
        currency: data.currency,
        status: "completed",
        transactionType: "sale",
      };

      const items = data.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        total: (Number(item.price) * item.quantity).toString(),
      }));

      console.log("Sending transaction data:", { transaction: transactionData, items });
      return await apiRequest("POST", "/api/transactions", { transaction: transactionData, items });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/metrics"] });
      toast({
        title: "تم بنجاح",
        description: "تم إنشاء الفاتورة بنجاح",
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      console.error("Invoice creation error:", error);
      toast({
        title: "خطأ",
        description: "فشل في إنشاء الفاتورة",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InvoiceFormData) => {
    console.log("Form submitted with data:", data);
    createInvoiceMutation.mutate(data);
  };

  const handleProductChange = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      form.setValue(`items.${index}.productId`, productId);
      form.setValue(`items.${index}.productName`, product.name);
      form.setValue(`items.${index}.price`, product.price);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      form.setValue("customerId", customerId);
      form.setValue("customerName", customer.name);
    }
  };

  const getCurrencySymbol = (curr: string) => {
    return curr === "USD" ? "$" : "₺";
  };

  // Filter products based on search query
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
    (product.barcode && product.barcode.includes(productSearchQuery))
  );

  // Handle barcode scan
  const handleBarcodeScan = () => {
    if (!barcodeInput.trim()) return;
    
    const product = products.find(p => p.barcode === barcodeInput.trim());
    if (product) {
      // Add new item or update existing one
      const newItem = {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        price: product.price,
        total: product.price,
      };
      
      append(newItem);
      setBarcodeInput("");
      setShowBarcodeInput(false);
      
      toast({
        title: "تم إضافة المنتج",
        description: `تم إضافة ${product.name} للفاتورة`,
      });
    } else {
      toast({
        title: "منتج غير موجود",
        description: "لم يتم العثور على منتج بهذا الباركود",
        variant: "destructive",
      });
    }
  };

  // Quick add product from search
  const addProductFromSearch = (product: Product) => {
    const newItem = {
      productId: product.id,
      productName: product.name,
      quantity: 1,
      price: product.price,
      total: product.price,
    };
    
    append(newItem);
    setProductSearchQuery("");
    setSelectedItemIndex(null);
    
    toast({
      title: "تم إضافة المنتج",
      description: `تم إضافة ${product.name} للفاتورة`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="invoice-description">
        <DialogHeader>
          <DialogTitle className="text-right flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            إنشاء فاتورة جديدة
          </DialogTitle>
          <div id="invoice-description" className="sr-only">
            نموذج إنشاء فاتورة جديدة مع إضافة المنتجات والعملاء
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">معلومات العميل</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>اختيار عميل موجود</Label>
                  <Select onValueChange={handleCustomerChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر عميل" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerName">اسم العميل *</Label>
                  <Input
                    id="customerName"
                    placeholder="أدخل اسم العميل"
                    {...form.register("customerName")}
                    className="text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>العملة</Label>
                  <Select 
                    value={form.watch("currency")} 
                    onValueChange={(value) => form.setValue("currency", value as "TRY" | "USD")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر العملة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRY">ليرة تركية (₺)</SelectItem>
                      <SelectItem value="USD">دولار أمريكي ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>نوع الدفع</Label>
                  <Select 
                    value={form.watch("paymentType")} 
                    onValueChange={(value) => form.setValue("paymentType", value as "cash" | "credit")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع الدفع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">نقد</SelectItem>
                      <SelectItem value="credit">دين</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                الأصناف
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setShowBarcodeInput(!showBarcodeInput)}
                    variant="outline"
                  >
                    <QrCode className="h-4 w-4 ml-2" />
                    مسح باركود
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => append({ productId: "", productName: "", quantity: 1, price: "0", total: "0" })}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة صنف
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Barcode Input */}
              {showBarcodeInput && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <QrCode className="h-5 w-5 text-blue-600" />
                    <Label className="text-blue-800 font-medium">مسح الباركود</Label>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowBarcodeInput(false)}
                      className="ml-auto"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      placeholder="امسح أو أدخل رقم الباركود"
                      className="text-right"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleBarcodeScan();
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      type="button"
                      onClick={handleBarcodeScan}
                      disabled={!barcodeInput.trim()}
                      size="sm"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Product Search */}
              <div className="bg-slate-50 border rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Search className="h-5 w-5 text-slate-600" />
                  <Label className="font-medium">البحث السريع عن المنتجات</Label>
                </div>
                <Input
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  placeholder="ابحث بالاسم أو الكود أو الباركود..."
                  className="text-right mb-2"
                />
                
                {productSearchQuery && filteredProducts.length > 0 && (
                  <div className="max-h-40 overflow-y-auto border rounded bg-white">
                    {filteredProducts.slice(0, 5).map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-2 hover:bg-slate-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => addProductFromSearch(product)}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-slate-500">
                            كود: {product.sku} | المخزون: {product.quantity}
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="font-medium">{Number(product.price).toFixed(2)} {getCurrencySymbol(form.watch("currency"))}</div>
                          <Button size="sm" className="mt-1">
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {productSearchQuery && filteredProducts.length === 0 && (
                  <div className="text-center py-2 text-slate-500 text-sm">
                    لا توجد منتجات مطابقة للبحث
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-4 space-y-2">
                      <Label>المنتج</Label>
                      {watchedItems[index]?.productName ? (
                        <div className="h-10 bg-slate-50 border rounded-md flex items-center px-3">
                          <span className="flex-1">{watchedItems[index]?.productName}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              form.setValue(`items.${index}.productId`, "");
                              form.setValue(`items.${index}.productName`, "");
                              form.setValue(`items.${index}.price`, "0");
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Select onValueChange={(value) => handleProductChange(index, value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المنتج أو استخدم البحث السريع" />
                          </SelectTrigger>
                          <SelectContent>
                            {products.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} - {product.price} {getCurrencySymbol(form.watch("currency"))}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label>الكمية</Label>
                      <Input
                        type="number"
                        min="1"
                        {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                        className="text-right"
                      />
                    </div>

                    <div className="col-span-2 space-y-2">
                      <Label>السعر</Label>
                      <Input
                        type="number"
                        step="0.01"
                        {...form.register(`items.${index}.price`)}
                        className="text-right"
                      />
                    </div>

                    <div className="col-span-3 space-y-2">
                      <Label>المجموع</Label>
                      <div className="h-10 bg-slate-50 border rounded-md flex items-center px-3 text-slate-600">
                        {((Number(watchedItems[index]?.price) || 0) * (Number(watchedItems[index]?.quantity) || 0)).toFixed(2)} {getCurrencySymbol(form.watch("currency"))}
                      </div>
                    </div>

                    <div className="col-span-1">
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => remove(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                الإجماليات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="discount">الخصم</Label>
                  <Input
                    id="discount"
                    type="number"
                    step="0.01"
                    {...form.register("discount")}
                    className="text-right"
                  />
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">المجموع الفرعي:</span>
                  <span className="font-medium">{subtotal.toFixed(2)} {getCurrencySymbol(form.watch("currency"))}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">الخصم:</span>
                  <span className="font-medium">-{Number(watchedDiscount || 0).toFixed(2)} {getCurrencySymbol(form.watch("currency"))}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
                  <span>المجموع النهائي:</span>
                  <span className="text-blue-600">{finalTotal.toFixed(2)} {getCurrencySymbol(form.watch("currency"))}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-1">طرق إضافة المنتجات:</div>
              <ul className="space-y-1 text-xs">
                <li>• استخدم البحث السريع للعثور على المنتجات بسرعة</li>
                <li>• امسح الباركود لإضافة المنتج مباشرة</li>
                <li>• أو اختر من القائمة المنسدلة التقليدية</li>
              </ul>
            </div>
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
              disabled={createInvoiceMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {createInvoiceMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                  جارٍ الإنشاء...
                </>
              ) : (
                <>
                  <Receipt className="h-4 w-4 ml-2" />
                  إنشاء الفاتورة
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}