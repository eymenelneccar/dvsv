import type { Transaction } from "@shared/schema";

interface InvoiceItem {
  productName: string;
  quantity: number;
  price: string | number;
  total: string | number;
}

interface InvoiceTemplateProps {
  transaction: Transaction;
  items: InvoiceItem[];
}

export default function InvoiceTemplate({ transaction, items }: InvoiceTemplateProps) {
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + Number(item.total), 0);
    const discountAmount = Number(transaction.discount) || 0;
    const total = Number(transaction.total) || 0;

    const getCurrencySymbol = (currency: string) => {
      return currency === "USD" ? "$" : "₺";
    };

    return { subtotal, discountAmount, total };
  };

  const { subtotal, discountAmount, total } = calculateTotals();

  const getCurrencySymbol = (currency: string) => {
    return currency === "USD" ? "$" : "₺";
  };

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="border-b-2 border-blue-600 pb-6 mb-8">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-600 mb-2">فاتورة ضريبية</h1>
            <div className="text-slate-600 space-y-1">
              <p>شركة ERP Pro للتجارة</p>
              <p>الرقم الضريبي: 300123456700003</p>
              <p>الرياض، المملكة العربية السعودية</p>
              <p>هاتف: +966 11 123 4567</p>
              <p>البريد الإلكتروني: info@erppro.com</p>
            </div>
          </div>

          <div className="text-left">
            <div className="bg-slate-100 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-slate-800 mb-3">معلومات الفاتورة</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">رقم الفاتورة:</span>
                  <span>{transaction.transactionNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">التاريخ:</span>
                  <span>{new Date(transaction.createdAt || "").toLocaleDateString('ar-SA')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">تاريخ الاستحقاق:</span>
                  <span>{new Date(new Date(transaction.createdAt || "").getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ar-SA')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Info */}
      <div className="mb-8">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-3">معلومات العميل</h3>
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="font-medium text-slate-800">{transaction.customerName}</p>
              <p className="text-slate-600">عميل عام</p>
              <p className="text-slate-600">المملكة العربية السعودية</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-3">معلومات الدفع</h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm space-y-1">
                <p><span className="font-medium">طريقة الدفع:</span> نقدي</p>
                <p><span className="font-medium">الحالة:</span> 
                  <span className={`mr-2 px-2 py-1 rounded text-xs ${
                    transaction.status === 'completed' ? 'bg-green-100 text-green-600' :
                    transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {transaction.status === 'completed' ? 'مدفوعة' :
                     transaction.status === 'pending' ? 'معلقة' : 'ملغية'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">تفاصيل الفاتورة</h3>
        <table className="w-full border-collapse border border-slate-300">
          <thead className="bg-slate-100">
            <tr>
              <th className="border border-slate-300 px-4 py-3 text-right font-medium">البند</th>
              <th className="border border-slate-300 px-4 py-3 text-center font-medium">الكمية</th>
              <th className="border border-slate-300 px-4 py-3 text-center font-medium">السعر</th>
              <th className="border border-slate-300 px-4 py-3 text-center font-medium">المجموع</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50">
                <td className="border border-slate-300 px-4 py-3">{item.productName}</td>
                <td className="border border-slate-300 px-4 py-3 text-center">{item.quantity}</td>
                <td className="border border-slate-300 px-4 py-3 text-center">{Number(item.price).toFixed(2)} ر.س</td>
                <td className="border border-slate-300 px-4 py-3 text-center font-medium">{Number(item.total).toFixed(2)} ر.س</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-80">
          <div className="bg-slate-50 p-4 rounded-lg space-y-3">
            <div className="flex justify-between py-2 border-b border-slate-200">
              <span>المجموع الفرعي:</span>
              <span className="font-medium">{subtotal.toFixed(2)} {getCurrencySymbol(transaction.currency || "TRY")}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between py-2 border-b border-slate-200 text-red-600">
                <span>الخصم:</span>
                <span className="font-medium">-{discountAmount.toFixed(2)} {getCurrencySymbol(transaction.currency || "TRY")}</span>
              </div>
            )}

            <div className="flex justify-between py-2 text-lg font-bold bg-blue-50 px-4 text-blue-800">
              <span>المجموع النهائي:</span>
              <span>{total.toFixed(2)} {getCurrencySymbol(transaction.currency || "TRY")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Terms and Footer */}
      <div className="border-t border-slate-200 pt-6">
        <div className="grid grid-cols-2 gap-8 text-sm text-slate-600">
          <div>
            <h4 className="font-semibold text-slate-800 mb-2">الشروط والأحكام:</h4>
            <ul className="space-y-1">
              <li>• الدفع مستحق خلال 30 يوماً من تاريخ الفاتورة</li>
              <li>• في حالة التأخير في السداد، سيتم تطبيق غرامة مالية</li>
              <li>• يجب الاحتفاظ بهذه الفاتورة لأغراض الضمان</li>
            </ul>
          </div>

          <div className="text-left">
            <h4 className="font-semibold text-slate-800 mb-2">بيانات الاتصال:</h4>
            <div className="space-y-1">
              <p>الموقع الإلكتروني: www.erppro.com</p>
              <p>البريد الإلكتروني: support@erppro.com</p>
              <p>خدمة العملاء: +966 11 123 4567</p>
            </div>
          </div>
        </div>

        <div className="text-center mt-6 pt-4 border-t border-slate-200">
          <p className="text-blue-600 font-medium">شكراً لك على ثقتك في خدماتنا</p>
          <p className="text-sm text-slate-500 mt-1">تم إنشاء هذه الفاتورة إلكترونياً ولا تحتاج إلى توقيع</p>
        </div>
      </div>
    </div>
  );
}