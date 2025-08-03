import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, Users } from "lucide-react";

export default function MetricsCards() {
  const { data: metrics, isLoading } = useQuery<any>({
    queryKey: ["/api/dashboard/metrics"],
    retry: false,
  });

  const cards = [
    {
      title: "إجمالي المبيعات",
      value: metrics?.totalSales ? `${metrics.totalSales.toLocaleString()} ₺ $` : "0 ₺ $",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      color: "green",
    },
    {
      title: "عدد الطلبات",
      value: metrics?.totalOrders?.toLocaleString() || "0",
      change: "+8.2%",
      trend: "up",
      icon: ShoppingCart,
      color: "blue",
    },
    {
      title: "المنتجات النشطة",
      value: metrics?.activeProducts?.toLocaleString() || "0",
      change: "-2.1%",
      trend: "down",
      icon: Package,
      color: "yellow",
    },
    {
      title: "العملاء الجدد",
      value: metrics?.newCustomers?.toLocaleString() || "0",
      change: "+15.3%",
      trend: "up",
      icon: Users,
      color: "purple",
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "green":
        return "bg-green-100 text-green-600";
      case "blue":
        return "bg-blue-100 text-blue-600";
      case "yellow":
        return "bg-yellow-100 text-yellow-600";
      case "purple":
        return "bg-purple-100 text-purple-600";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-slate-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-1/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const TrendIcon = card.trend === "up" ? TrendingUp : TrendingDown;

        return (
          <Card key={index} className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">{card.title}</p>
                  <p className="text-2xl font-bold text-slate-800 mt-1">{card.value}</p>
                  <p className={`text-sm mt-1 flex items-center gap-1 ${
                    card.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}>
                    <TrendIcon className="h-3 w-3" />
                    {card.change}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getColorClasses(card.color)}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
