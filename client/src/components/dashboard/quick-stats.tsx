import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Props = {
  currency: string;
};

export default function QuickStats({ currency }: Props) {
  const { data: metrics, isLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/metrics"],
    retry: false,
  });

  const stats = [
    {
      label: "المخزون المنخفض",
      value: metrics?.lowStockCount || 0,
      unit: "منتج",
      color: "bg-red-100 text-red-600",
    },
    {
      label: "الطلبات المعلقة",
      value: metrics?.pendingOrders || 0,
      unit: "طلب",
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      label: "العملاء النشطون",
      value: metrics?.activeCustomers || 0,
      unit: "عميل",
      color: "bg-green-100 text-green-600",
    },
    {
      label: "المرتجعات",
      value: metrics?.returns || 0,
      unit: "مرتجع",
      color: "bg-blue-100 text-blue-600",
    },
  ];

  return (
    <Card className="shadow-sm border">
      <CardHeader>
        <CardTitle>إحصائيات سريعة</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {stats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-slate-600">{stat.label}</span>
                  <Badge className={stat.color}>
                    {stat.value} {stat.unit}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                عرض التقرير الكامل
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
