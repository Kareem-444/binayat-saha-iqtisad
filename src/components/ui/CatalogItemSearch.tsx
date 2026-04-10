import { useState, useEffect, useRef, useMemo } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface CatalogItem {
  "كود الصنف": string;
  "اسم الصنف": string;
  "مجموعة الصنف": string;
  "الوحدة": string;
  "طبيعة الصنف": string;
  "سعر الصنف": number;
}

export interface CatalogItemSearchProps {
  value: string;
  onChange: (code: string, name: string, unit: string) => void;
  placeholder?: string;
}

export default function CatalogItemSearch({ value, onChange, placeholder = "ابحث بالكود أو الاسم..." }: CatalogItemSearchProps) {
  const [search, setSearch] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Dynamically import catalog data on mount
  useEffect(() => {
    let mounted = true;
    const loadCatalog = async () => {
      try {
        const data = await import("../../data/items_catalog.json");
        if (mounted) {
          setItems(data.default as CatalogItem[]);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load catalog:", err);
        if (mounted) setLoading(false);
      }
    };
    loadCatalog();
    return () => { mounted = false; };
  }, []);

  // Sync external value changes
  useEffect(() => {
    setSearch(value);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter results
  const results = useMemo(() => {
    if (search.length < 2) return [];
    const term = search.trim();
    return items.filter((item) =>
      item["كود الصنف"].startsWith(term) ||
      item["اسم الصنف"].includes(term)
    ).slice(0, 10);
  }, [search, items]);

  const handleSelect = (item: CatalogItem) => {
    onChange(item["كود الصنف"], item["اسم الصنف"], item["الوحدة"]);
    setSearch(item["كود الصنف"]);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearch(val);
    setIsOpen(true);
    // If user clears or changes the code, reset parent fields
    if (val !== value) {
      onChange(val, "", "");
    }
  };

  return (
    <div ref={wrapperRef} className="relative" dir="rtl">
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={search}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="pr-9"
        />
        {loading && (
          <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && !loading && (
        <div className="absolute z-50 mt-1 w-full border border-border rounded-lg bg-background shadow-lg max-h-64 overflow-y-auto">
          {search.length < 2 ? (
            <div className="px-4 py-3 text-xs text-muted-foreground text-center">
              اكتب حرفين أو أكثر للبحث...
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-xs text-muted-foreground text-center">
              لا توجد نتائج
            </div>
          ) : (
            results.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full px-4 py-2.5 text-sm hover:bg-muted transition-colors border-b last:border-b-0 text-right"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-primary font-semibold">{item["كود الصنف"]}</span>
                  <span className="flex-1 font-medium truncate">{item["اسم الصنف"]}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">{item["الوحدة"]}</span>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
