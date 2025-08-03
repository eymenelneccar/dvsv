import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode, Search, Plus } from "lucide-react";
import type { Product } from "@shared/schema";

interface BarcodeScannerProps {
  onProductSelect: (product: Product) => void;
  placeholder?: string;
}

export default function BarcodeScanner({ onProductSelect, placeholder = "امسح أو أدخل الباركود..." }: BarcodeScannerProps) {
  const [barcode, setBarcode] = useState("");
  const [lastScanned, setLastScanned] = useState("");

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ["/api/products/barcode", lastScanned],
    enabled: !!lastScanned,
    retry: false,
  });

  const handleScan = () => {
    if (!barcode.trim()) return;
    setLastScanned(barcode.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleScan();
    }
  };

  const handleProductSelect = () => {
    if (product) {
      onProductSelect(product);
      setBarcode("");
      setLastScanned("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          مسح الباركود
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="barcode">رقم الباركود</Label>
          <div className="flex gap-2">
            <Input
              id="barcode"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className="text-right"
              autoFocus
            />
            <Button 
              onClick={handleScan}
              disabled={!barcode.trim() || isLoading}
              size="sm"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-slate-600 mt-2">جاري البحث...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-800 text-sm">المنتج غير موجود أو حدث خطأ في البحث</p>
          </div>
        )}

        {product && !isLoading && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-green-800">{product.name}</h4>
                <p className="text-sm text-green-600">كود المنتج: {product.sku}</p>
                <p className="text-sm text-green-600">الباركود: {product.barcode}</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-lg font-bold text-green-800">{Number(product.price).toFixed(2)} ر.س</span>
                  <Badge variant={Number(product.quantity) > 0 ? "default" : "destructive"}>
                    المخزون: {product.quantity}
                  </Badge>
                </div>
              </div>
              <Button 
                onClick={handleProductSelect}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="h-4 w-4 ml-1" />
                إضافة
              </Button>
            </div>
          </div>
        )}

        <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
          <p>• يمكنك مسح الباركود باستخدام جهاز المسح المتصل</p>
          <p>• أو إدخال رقم الباركود يدوياً والضغط على Enter</p>
          <p>• سيتم البحث عن المنتج تلقائياً</p>
        </div>
      </CardContent>
    </Card>
  );
}