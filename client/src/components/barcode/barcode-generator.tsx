import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, Download } from "lucide-react";

interface BarcodeGeneratorProps {
  value: string;
  productName?: string;
  price?: string;
}

export default function BarcodeGenerator({ value, productName, price }: BarcodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Simple barcode generation (Code 128 style bars)
  const generateBarcode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 300;
    canvas.height = 100;

    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Generate simple barcode pattern
    ctx.fillStyle = 'black';
    const barWidth = 2;
    let x = 20;

    // Convert value to binary pattern (simplified)
    for (let i = 0; i < value.length; i++) {
      const charCode = value.charCodeAt(i);
      const pattern = charCode.toString(2).padStart(8, '0');
      
      for (let j = 0; j < pattern.length; j++) {
        if (pattern[j] === '1') {
          ctx.fillRect(x, 10, barWidth, 60);
        }
        x += barWidth;
      }
      x += 2; // Gap between characters
    }

    // Add text below barcode
    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(value, canvas.width / 2, 85);
  };

  const printBarcode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const img = canvas.toDataURL();
    printWindow.document.write(`
      <html>
        <head>
          <title>طباعة باركود - ${productName || value}</title>
          <style>
            body { 
              margin: 0; 
              padding: 20px; 
              font-family: Arial, sans-serif; 
              text-align: center;
            }
            .barcode-container {
              border: 1px solid #ccc;
              padding: 15px;
              margin: 10px auto;
              width: fit-content;
            }
            .product-info {
              margin-bottom: 10px;
              font-size: 14px;
            }
            @media print {
              body { margin: 0; padding: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="barcode-container">
            ${productName ? `<div class="product-info"><strong>${productName}</strong></div>` : ''}
            ${price ? `<div class="product-info">السعر: ${price} ر.س</div>` : ''}
            <img src="${img}" alt="باركود" />
          </div>
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

  const downloadBarcode = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `barcode-${value}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  // Generate barcode when component mounts or value changes
  useEffect(() => {
    generateBarcode();
  }, [value]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>باركود المنتج</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        {productName && (
          <div>
            <h4 className="font-medium">{productName}</h4>
            {price && <p className="text-sm text-slate-600">السعر: {price} ر.س</p>}
          </div>
        )}
        
        <div className="border rounded-lg p-4 bg-white">
          <canvas 
            ref={canvasRef}
            className="mx-auto border"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>

        <div className="flex gap-2 justify-center">
          <Button onClick={printBarcode} size="sm">
            <Printer className="h-4 w-4 ml-1" />
            طباعة
          </Button>
          <Button onClick={downloadBarcode} variant="outline" size="sm">
            <Download className="h-4 w-4 ml-1" />
            تحميل
          </Button>
        </div>

        <p className="text-xs text-slate-500">
          الباركود: {value}
        </p>
      </CardContent>
    </Card>
  );
}