import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Package, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { inventoryApi } from "@/api/client";

interface ItemSelectorProps {
  value: number | null;
  onChange: (itemId: number | null, item?: any) => void;
  showStockValidation?: boolean;
  movementType?: "وارد" | "صادر";
}

export default function ItemSelector({ value, onChange, showStockValidation = false, movementType }: ItemSelectorProps) {
  const [search, setSearch] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: () => inventoryApi.list().then(r => r.data),
  });

  const filteredItems = useMemo(() => {
    if (!search) return items;
    const searchLower = search.toLowerCase();
    return items.filter((item: any) => 
      item.name?.toLowerCase().includes(searchLower) ||
      item.code?.toLowerCase().includes(searchLower) ||
      item.category?.toLowerCase().includes(searchLower)
    );
  }, [items, search]);

  const selectedItem = items.find((item: any) => item.id === value);

  const handleSelect = (item: any) => {
    onChange(item.id, item);
    setSearch("");
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">اختر الصنف *</label>
      
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="بحث بالصنف، الكود، أو الفئة..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pr-9"
        />
      </div>

      {/* Dropdown List */}
      {isOpen && (
        <div className="border rounded-lg bg-background max-h-60 overflow-y-auto shadow-lg">
          {isLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">جاري التحميل...</div>
          ) : filteredItems.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">لا توجد نتائج</div>
          ) : (
            filteredItems.map((item: any) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                className="px-4 py-3 hover:bg-muted cursor-pointer border-b last:border-b-0 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <Package className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.code ? `[${item.code}]` : ""} {item.category || "بدون فئة"} • {item.unit || "وحدة"}
                    </p>
                  </div>
                  <div className="text-xs font-bold text-primary flex-shrink-0">
                    المخزون: {Number(item.quantity || 0).toLocaleString("ar-EG")}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Selected Item Summary */}
      {selectedItem && showStockValidation && (
        <div className={`rounded-lg p-3 border ${
          movementType === "صادر" && Number(selectedItem.quantity || 0) <= Number(selectedItem.min_stock || 0)
            ? "border-red-200 bg-red-50"
            : "border-border bg-muted/50"
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{selectedItem.name}</p>
              <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                <span>الفئة: {selectedItem.category || "—"}</span>
                <span>الوحدة: {selectedItem.unit || "وحدة"}</span>
                {selectedItem.warehouse_name && <span>المستودع: {selectedItem.warehouse_name}</span>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">المخزون الحالي</p>
              <p className={`text-lg font-black ${
                movementType === "صادر" && Number(selectedItem.quantity || 0) <= Number(selectedItem.min_stock || 0)
                  ? "text-red-600"
                  : "text-primary"
              }`}>
                {Number(selectedItem.quantity || 0).toLocaleString("ar-EG")} {selectedItem.unit}
              </p>
              {movementType === "صادر" && Number(selectedItem.quantity || 0) <= Number(selectedItem.min_stock || 0) && (
                <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  <span>مخزون منخفض</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
