import { useState, useMemo, useEffect } from "react";
import { Search, Package, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Type for item
interface Item {
  "كود الصنف": string;
  "اسم الصنف": string;
  "مجموعة الصنف": string;
  "الوحدة": string;
  "طبيعة الصنف": string;
  "سعر الصنف": number;
}

const ITEMS_PER_PAGE = 100;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 2 }).format(value) + " ج.م";

export default function ItemsCatalog() {
  const [items, setItems] = useState<Item[]>([]);
  const [uniqueGroups, setUniqueGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Load items data dynamically (code-split)
  useEffect(() => {
    let mounted = true;
    const loadItems = async () => {
      try {
        const data = await import("../data/items_catalog.json");
        if (mounted) {
          const loadedItems = data.default as Item[];
          setItems(loadedItems);
          const groups = Array.from(new Set(loadedItems.map((item) => item["مجموعة الصنف"]))).sort();
          setUniqueGroups(groups);
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to load items catalog:", error);
        if (mounted) {
          setLoading(false);
        }
      }
    };
    loadItems();
    return () => {
      mounted = false;
    };
  }, []);

  // Filter items based on search and group
  const filteredItems = useMemo(() => {
    let result = items;

    // Filter by group
    if (groupFilter !== "all") {
      result = result.filter((item) => item["مجموعة الصنف"] === groupFilter);
    }

    // Filter by search (name or code)
    if (search.trim()) {
      const searchTerm = search.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item["اسم الصنف"].toLowerCase().includes(searchTerm) ||
          item["كود الصنف"].toLowerCase().includes(searchTerm)
      );
    }

    return result;
  }, [search, groupFilter, items]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, groupFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPageItems = filteredItems.slice(startIndex, endIndex);

  // Page numbers to show
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // Show last page
      pages.push(totalPages);
    }

    return pages;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">إجمالي الأصناف</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <p className="text-base font-bold text-foreground">
            {items.length.toLocaleString("ar-EG")} صنف
          </p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">الأصناف المعروضة</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-700">
              <Filter className="h-4 w-4" />
            </div>
          </div>
          <p className="text-base font-bold text-foreground">
            {filteredItems.length.toLocaleString("ar-EG")} صنف
          </p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">الصفحة الحالية</p>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <p className="text-base font-bold text-foreground">
            {currentPage} / {totalPages}
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="بحث باسم الصنف أو الكود..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-9"
          />
        </div>
        <Select value={groupFilter} onValueChange={setGroupFilter}>
          <SelectTrigger className="w-full sm:w-[250px]">
            <SelectValue placeholder="تصفية حسب المجموعة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">جميع المجموعات</SelectItem>
            {uniqueGroups.map((group) => (
              <SelectItem key={group} value={group}>
                {group}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">كود الصنف</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">اسم الصنف</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">مجموعة الصنف</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">الوحدة</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">سعر الصنف</th>
              </tr>
            </thead>
            <tbody>
              {currentPageItems.map((item, idx) => (
                <tr key={startIndex + idx} className="border-b border-border/50 table-row-hover last:border-0">
                  <td className="py-3 px-4 text-xs font-mono text-primary font-semibold">
                    {item["كود الصنف"]}
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-xs font-semibold text-foreground">{item["اسم الصنف"]}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 border border-blue-200">
                      {item["مجموعة الصنف"]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-muted-foreground">
                    {item["الوحدة"]}
                  </td>
                  <td className="py-3 px-4 text-xs font-semibold text-foreground">
                    {formatCurrency(item["سعر الصنف"])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredItems.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">لا توجد نتائج مطابقة</p>
            </div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            عرض {startIndex + 1} - {Math.min(endIndex, filteredItems.length)} من {filteredItems.length.toLocaleString("ar-EG")} صنف
          </p>

          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="gap-1"
            >
              <ChevronRight className="h-4 w-4" />
              <span>السابق</span>
            </Button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, idx) =>
                typeof page === "string" ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
                    ...
                  </span>
                ) : (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="min-w-[32px] h-8 text-xs"
                  >
                    {page}
                  </Button>
                )
              )}
            </div>

            {/* Next Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="gap-1"
            >
              <span>التالي</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
