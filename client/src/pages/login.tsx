import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Lock, User, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const { toast } = useToast();

  const loginMutation = useMutation({
    mutationFn: async (loginData: { username: string; password: string }) => {
      // Simple validation - in real app this would be against backend
      if (loginData.username === "eymen" && loginData.password === "eymen") {
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("username", loginData.username);
        return { success: true, user: { username: loginData.username, role: "admin" } };
      } else {
        throw new Error("اسم المستخدم أو كلمة المرور غير صحيحة");
      }
    },
    onSuccess: () => {
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في نظام إدارة الموارد",
      });
      window.location.reload();
    },
    onError: (error: Error) => {
      toast({
        title: "فشل تسجيل الدخول",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!credentials.username || !credentials.password) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم المستخدم وكلمة المرور",
        variant: "destructive",
      });
      return;
    }

    loginMutation.mutate(credentials);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
            <Lock className="h-10 w-10 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl text-slate-800">تسجيل الدخول</CardTitle>
            <p className="text-slate-600 mt-2">نظام إدارة الموارد المؤسسية</p>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-right">اسم المستخدم</Label>
              <div className="relative">
                <User className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="أدخل اسم المستخدم"
                  value={credentials.username}
                  onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                  className="pr-10 text-right"
                  dir="rtl"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-right">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="أدخل كلمة المرور"
                  value={credentials.password}
                  onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                  className="pr-10 pl-10 text-right"
                  dir="rtl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            <p>© 2024 نظام إدارة الموارد المؤسسية</p>
            <p>جميع الحقوق محفوظة</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
