import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import InvoiceTemplate from "./invoice-template";
import { Printer, Download, Share2 } from "lucide-react";
import type { Transaction } from "@shared/schema";

interface InvoiceViewerProps {
  open: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export default function InvoiceViewer({ open, onClose, transaction }: InvoiceViewerProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!transaction) return null;

  const printInvoice = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !invoiceRef.current) return;

    const invoiceHTML = invoiceRef.current.innerHTML;
    printWindow.document.write(`
      <html>
        <head>
          <title>فاتورة ${transaction.transactionNumber}</title>
          <style>
            body { 
              margin: 0; 
              padding: 0; 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              direction: rtl;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none !important; }
            }
            /* Copy necessary Tailwind styles */
            .bg-white { background-color: white; }
            .p-8 { padding: 2rem; }
            .border-b-2 { border-bottom-width: 2px; }
            .border-blue-600 { border-color: #2563eb; }
            .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
            .font-bold { font-weight: 700; }
            .text-blue-600 { color: #2563eb; }
            .text-slate-600 { color: #475569; }
            .text-slate-800 { color: #1e293b; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .gap-8 { gap: 2rem; }
            .mb-8 { margin-bottom: 2rem; }
            .mb-6 { margin-bottom: 1.5rem; }
            .mb-3 { margin-bottom: 0.75rem; }
            .space-y-1 > * + * { margin-top: 0.25rem; }
            .space-y-2 > * + * { margin-top: 0.5rem; }
            .space-y-3 > * + * { margin-top: 0.75rem; }
            .w-full { width: 100%; }
            .border-collapse { border-collapse: collapse; }
            .border { border-width: 1px; }
            .border-slate-300 { border-color: #cbd5e1; }
            .bg-slate-100 { background-color: #f1f5f9; }
            .px-4 { padding-left: 1rem; padding-right: 1rem; }
            .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .text-center { text-align: center; }
            .hover\\:bg-slate-50:hover { background-color: #f8fafc; }
            .font-medium { font-weight: 500; }
            .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
            .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
            .font-semibold { font-weight: 600; }
            .bg-slate-50 { background-color: #f8fafc; }
            .rounded-lg { border-radius: 0.5rem; }
            .bg-blue-50 { background-color: #eff6ff; }
            .text-blue-600 { color: #2563eb; }
            .border-t { border-top-width: 1px; }
            .border-slate-200 { border-color: #e2e8f0; }
            .pt-6 { padding-top: 1.5rem; }
            .text-slate-500 { color: #64748b; }
            .justify-end { justify-content: flex-end; }
            .w-80 { width: 20rem; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
            .border-b { border-bottom-width: 1px; }
            .text-red-600 { color: #dc2626; }
            .bg-blue-50 { background-color: #eff6ff; }
            .px-4 { padding-left: 1rem; padding-right: 1rem; }
            .text-blue-800 { color: #1e40af; }
          </style>
        </head>
        <body>
          ${invoiceHTML}
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

  const downloadPDF = async () => {
    try {
      // For real implementation, you would use jsPDF or similar
      // This is a simplified version that triggers browser's PDF save
      printInvoice();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('حدث خطأ في تصدير PDF. يرجى المحاولة مرة أخرى.');
    }
  };

  const shareInvoice = () => {
    if (navigator.share) {
      navigator.share({
        title: `فاتورة ${transaction.transactionNumber}`,
        text: `فاتورة بقيمة ${Number(transaction.total).toFixed(2)} ر.س`,
        url: window.location.href
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      const whatsappMessage = `فاتورة ${transaction.transactionNumber}%0A` +
        `العميل: ${transaction.customerName}%0A` +
        `المبلغ: ${Number(transaction.total).toFixed(2)} ر.س%0A` +
        `التاريخ: ${new Date(transaction.createdAt || "").toLocaleDateString('ar-SA')}`;
      
      window.open(`https://wa.me/?text=${whatsappMessage}`, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>عرض الفاتورة - {transaction.transactionNumber}</DialogTitle>
            <div className="flex gap-2">
              <Button onClick={printInvoice} size="sm">
                <Printer className="h-4 w-4 ml-1" />
                طباعة
              </Button>
              <Button onClick={downloadPDF} variant="outline" size="sm">
                <Download className="h-4 w-4 ml-1" />
                PDF
              </Button>
              <Button onClick={shareInvoice} variant="outline" size="sm">
                <Share2 className="h-4 w-4 ml-1" />
                مشاركة
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div ref={invoiceRef}>
          <InvoiceTemplate 
            transaction={transaction}
            items={[
              {
                productName: "منتج تجريبي",
                quantity: 1,
                price: transaction.total,
                total: transaction.total
              }
            ]}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}