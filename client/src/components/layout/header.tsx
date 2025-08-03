import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell, Plus, Search } from "lucide-react";
import QuickAddModal from "@/components/modals/quick-add-modal";

interface HeaderProps {
  title: string;
  subtitle: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  return (
    <>
      <header className="bg-white shadow-sm border-b border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
            <p className="text-slate-600 mt-1">{subtitle}</p>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              className="bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => setShowQuickAdd(true)}
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة جديد
            </Button>
            <div className="relative">
              <Search className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="البحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-100 border-0 pr-10 w-64 focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-slate-400" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                3
              </span>
            </Button>
          </div>
        </div>
      </header>

      <QuickAddModal open={showQuickAdd} onClose={() => setShowQuickAdd(false)} />
    </>
  );
}
