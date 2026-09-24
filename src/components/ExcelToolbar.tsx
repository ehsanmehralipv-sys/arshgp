import React, { useState } from 'react';
import { WCCategory } from '../types';
import { HierarchicalCategory } from '../utils/categoryTree';
import {
  Search,
  Filter,
  SlidersHorizontal,
  TableProperties,
  Layers,
  Edit3,
  Columns,
  Trash2,
  CheckSquare,
  Plus,
  RefreshCw,
  Wand2,
  Download,
  Upload,
  Bookmark,
} from 'lucide-react';

interface ExcelToolbarProps {
  categories: (WCCategory | HierarchicalCategory)[];
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  stockStatusFilter: string;
  onStockStatusFilterChange: (status: string) => void;
  selectedProductIds: number[];
  totalProductsCount: number;
  filteredProductsCount: number;
  tableDensity: 'compact' | 'normal' | 'relaxed';
  onChangeDensity: (density: 'compact' | 'normal' | 'relaxed') => void;
  onOpenBulkEditModal: () => void;
  onOpenAcfManagerModal: () => void;
  onOpenMediaUploadModal: () => void;
  onToggleColumnVisibility: () => void;
  onDeleteSelectedProducts: () => void;
  onResetPendingChanges: () => void;
  onOpenReferenceModal?: () => void;
  pendingChangesCount: number;
}

export const ExcelToolbar: React.FC<ExcelToolbarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  stockStatusFilter,
  onStockStatusFilterChange,
  selectedProductIds,
  totalProductsCount,
  filteredProductsCount,
  tableDensity,
  onChangeDensity,
  onOpenBulkEditModal,
  onOpenAcfManagerModal,
  onOpenMediaUploadModal,
  onToggleColumnVisibility,
  onDeleteSelectedProducts,
  onResetPendingChanges,
  onOpenReferenceModal,
  pendingChangesCount,
}) => {
  return (
    <div className="bg-[#16191f] border-b border-[#2d323b] px-4 py-2.5 text-slate-200 sticky top-0 z-20 shadow-sm shrink-0">
      <div className="max-w-full mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Left Side: Search & Category Filters */}
        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-[280px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="جستجو در نام، کد SKU یا شناسه..."
              className="w-full bg-[#0f1115] border border-[#30363d] rounded-lg pr-9 pl-7 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ×
              </button>
            )}
          </div>

          {/* Category Dropdown Filter (Including All Parents and Subcategories) */}
          <div className="relative min-w-[170px] max-w-[260px]">
            <select
              value={selectedCategory}
              onChange={(e) => onSelectCategory(e.target.value)}
              className="w-full bg-[#0f1115] border border-[#30363d] rounded-lg pr-3 pl-8 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer truncate"
              title="فیلتر بر اساس دسته‌بندی و زیردسته‌ها"
            >
              <option value="">همه دسته‌بندی‌ها ({totalProductsCount})</option>
              {categories.map((cat: any) => {
                const depth = cat.depth || 0;
                const prefix = depth === 0 
                  ? '📁 ' 
                  : depth === 1 
                    ? '  └─ ' 
                    : `${'  '.repeat(depth)}└── `;
                
                return (
                  <option 
                    key={cat.id} 
                    value={cat.id.toString()}
                    className={depth === 0 ? 'font-bold bg-slate-900 text-slate-100' : 'bg-slate-950 text-slate-300'}
                  >
                    {prefix}{cat.name} ({cat.count ?? 0})
                  </option>
                );
              })}
            </select>
            <Filter className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Stock Status Filter */}
          <div className="relative min-w-[130px]">
            <select
              value={stockStatusFilter}
              onChange={(e) => onStockStatusFilterChange(e.target.value)}
              className="w-full bg-[#0f1115] border border-[#30363d] rounded-lg pr-3 pl-8 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer"
            >
              <option value="all">همه موجودی‌ها</option>
              <option value="instock">فقط موجود در انبار</option>
              <option value="outofstock">فقط ناموجود</option>
              <option value="onbackorder">پیش‌خرید</option>
            </select>
            <SlidersHorizontal className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Reset Filters button if any active */}
          {(searchQuery || selectedCategory || stockStatusFilter !== 'all') && (
            <button
              onClick={() => {
                onSearchChange('');
                onSelectCategory('');
                onStockStatusFilterChange('all');
              }}
              className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline px-2 py-1 bg-amber-950/30 border border-amber-500/30 rounded-lg flex items-center gap-1"
            >
              <span>حذف فیلترها</span>
            </button>
          )}
        </div>

        {/* Right Side: Spreadsheet Control Tools */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Selected Row Bulk Actions */}
          {selectedProductIds.length > 0 && (
            <div className="flex items-center gap-1 bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-1 rounded-lg animate-fade-in">
              <span className="text-xs font-bold text-emerald-300 ml-1">
                {selectedProductIds.length} انتخاب شده
              </span>

              <button
                onClick={onOpenBulkEditModal}
                className="flex items-center gap-1 bg-[#238636] hover:bg-[#2ea043] text-white text-xs px-2.5 py-1 rounded transition-colors font-semibold shadow-sm"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>ویرایش گروهی</span>
              </button>

              <button
                onClick={onDeleteSelectedProducts}
                className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded transition-colors"
                title="حذف موارد انتخاب شده"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Media & Datasheet Studio Button */}
          <button
            onClick={onOpenMediaUploadModal}
            className="flex items-center gap-1.5 bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-500/40 text-xs px-2.5 py-1.5 rounded-lg transition-all shadow-sm"
            title="آپلود مستقیم تصویر با واتر مارک اتوماتیک و دیتاشیت PDF"
          >
            <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline font-semibold">استودیو آپلود و دیتاشیت</span>
          </button>

          {/* Manage ACF Custom Fields */}
          <button
            onClick={onOpenAcfManagerModal}
            className="flex items-center gap-1.5 bg-[#21262d] hover:bg-[#30363d] text-purple-300 border border-purple-500/30 text-xs px-2.5 py-1.5 rounded-lg transition-all"
            title="مدیریت و افزودن ستون‌های فیلد سفارشی ACF"
          >
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline font-semibold">ستون‌های ACF</span>
          </button>

          {/* Table Density selector */}
          <div className="bg-[#0f1115] border border-[#30363d] rounded-lg p-0.5 flex items-center">
            <button
              onClick={() => onChangeDensity('compact')}
              className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                tableDensity === 'compact' ? 'bg-[#21262d] text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="نمای فشرده (ردیف‌های کوچک)"
            >
              فشرده
            </button>
            <button
              onClick={() => onChangeDensity('normal')}
              className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                tableDensity === 'normal' ? 'bg-[#21262d] text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="نمای استاندارد"
            >
              استاندارد
            </button>
            <button
              onClick={() => onChangeDensity('relaxed')}
              className={`px-2 py-0.5 text-[10px] rounded transition-colors ${
                tableDensity === 'relaxed' ? 'bg-[#21262d] text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="نمای راحت"
            >
              راحت
            </button>
          </div>

          {/* Column Toggler */}
          <button
            onClick={onToggleColumnVisibility}
            className="p-1.5 bg-[#21262d] hover:bg-[#30363d] text-slate-300 rounded-lg border border-[#30363d] transition-colors"
            title="مدیریت نمایش ستون‌ها"
          >
            <Columns className="w-4 h-4 text-slate-400" />
          </button>

          {/* Reset Pending changes if any */}
          {pendingChangesCount > 0 && (
            <button
              onClick={onResetPendingChanges}
              className="text-xs text-rose-400 hover:text-rose-300 hover:underline px-2 py-1 font-semibold"
              title="بازگرداندن تمام تغییرات ذخیره نشده به حالت قبل"
            >
              لغو تغییرات ({pendingChangesCount})
            </button>
          )}

          {/* Item counter stats */}
          <div className="text-[11px] text-slate-300 bg-[#0f1115] px-2.5 py-1 rounded-lg border border-[#30363d]">
            نمایش <span className="font-bold text-emerald-400">{filteredProductsCount}</span> از {totalProductsCount} محصول
          </div>
        </div>
      </div>
    </div>
  );
};
