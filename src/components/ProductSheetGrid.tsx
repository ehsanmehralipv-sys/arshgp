import React, { useState, useRef } from 'react';
import { WCProduct, WCCategory, ColumnDefinition } from '../types';
import {
  ExternalLink,
  Edit2,
  Check,
  X,
  Send,
  Eye,
  AlertCircle,
  Image as ImageIcon,
  Tag,
  Layers,
  ChevronDown,
  Sparkles,
  RotateCcw,
} from 'lucide-react';

interface ProductSheetGridProps {
  products: WCProduct[];
  categories: WCCategory[];
  columns: ColumnDefinition[];
  pendingChanges: Record<number, Partial<WCProduct>>;
  pendingAcfChanges: Record<number, Record<string, any>>;
  selectedProductIds: number[];
  onToggleSelectAll: () => void;
  onToggleSelectProduct: (id: number) => void;
  onCellEdit: (productId: number, field: string, value: any, isAcf?: boolean) => void;
  onSingleProductSync: (product: WCProduct) => void;
  onOpenDetailDrawer: (product: WCProduct) => void;
  tableDensity: 'compact' | 'normal' | 'relaxed';
  isSyncingProductId: number | null;
  isLoading?: boolean;
}

// Helper to format currency numbers cleanly (e.g. 68,500,000 تومان)
export function formatToman(val: string | number): string {
  if (val === undefined || val === null || val === '') return '—';
  const num = typeof val === 'number' ? val : parseFloat(val.toString().replace(/,/g, ''));
  if (isNaN(num)) return val.toString();
  return num.toLocaleString('fa-IR');
}

export const ProductSheetGrid: React.FC<ProductSheetGridProps> = ({
  products,
  categories,
  columns,
  pendingChanges,
  pendingAcfChanges,
  selectedProductIds,
  onToggleSelectAll,
  onToggleSelectProduct,
  onCellEdit,
  onSingleProductSync,
  onOpenDetailDrawer,
  tableDensity,
  isSyncingProductId,
  isLoading = false,
}) => {
  // Cell inline editing state
  const [editingCell, setEditingCell] = useState<{ productId: number; field: string; isAcf?: boolean } | null>(null);
  const [tempValue, setTempValue] = useState<any>('');

  const allSelected = products.length > 0 && selectedProductIds.length === products.length;

  const handleStartEdit = (product: WCProduct, field: string, currentValue: any, isAcf: boolean = false) => {
    setEditingCell({ productId: product.id, field, isAcf });
    setTempValue(currentValue ?? '');
  };

  const handleSaveEdit = (productId: number, field: string, isAcf: boolean = false) => {
    onCellEdit(productId, field, tempValue, isAcf);
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, productId: number, field: string, isAcf: boolean = false) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit(productId, field, isAcf);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  // Get current merged value (considering unsaved changes)
  const getDisplayValue = (product: WCProduct, field: string, isAcf: boolean = false) => {
    if (isAcf) {
      if (pendingAcfChanges[product.id] && pendingAcfChanges[product.id][field] !== undefined) {
        return pendingAcfChanges[product.id][field];
      }
      return product.acf?.[field] ?? '';
    }

    if (pendingChanges[product.id] && (pendingChanges[product.id] as any)[field] !== undefined) {
      return (pendingChanges[product.id] as any)[field];
    }
    return (product as any)[field] ?? '';
  };

  const isFieldModified = (productId: number, field: string, isAcf: boolean = false) => {
    if (isAcf) {
      return pendingAcfChanges[productId]?.[field] !== undefined;
    }
    return (pendingChanges[productId] as any)?.[field] !== undefined;
  };

  const isRowModified = (productId: number) => {
    return !!pendingChanges[productId] || !!pendingAcfChanges[productId];
  };

  // Density padding classes
  const pyClass = tableDensity === 'compact' ? 'py-1.5' : tableDensity === 'normal' ? 'py-3' : 'py-4';
  const textClass = tableDensity === 'compact' ? 'text-[11px]' : 'text-xs';

  return (
    <div className="w-full h-full overflow-auto bg-[#0f1115] custom-scrollbar relative">
      {/* Filter/Data Loading Banner */}
      {isLoading && (
        <div className="sticky top-0 z-40 w-full bg-gradient-to-r from-[#1b2f23] via-[#16191f] to-[#281c38] border-b border-emerald-500/40 px-4 py-2 text-xs font-bold text-emerald-300 flex items-center justify-center gap-2.5 shadow-lg">
          <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span>در حال فراخوانی و اعمال فیلتر محصولات... لطفا شکیبا باشید</span>
        </div>
      )}
      <table className="w-full text-right border-collapse select-none min-w-[1000px]">
        {/* Table Header Row (Excel Style Sticky Header) */}
        <thead>
          <tr className="bg-[#21262d] text-[#8b949e] font-bold text-xs border-b border-[#30363d] sticky top-0 z-20 shadow-md">
            {/* Checkbox Col */}
            <th className="p-2.5 w-10 text-center border-l border-[#2d323b] bg-[#21262d]">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleSelectAll}
                className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer"
              />
            </th>

            {/* Dynamic Columns Header */}
            {columns.filter((c) => c.visible).map((col) => (
              <th
                key={col.id}
                style={{ width: col.width ? `${col.width}px` : 'auto' }}
                className={`p-2.5 font-bold text-[#8b949e] border-l border-[#2d323b] ${
                  col.isAcf ? 'bg-[#281c38] text-purple-300' : 'bg-[#21262d]'
                }`}
              >
                <div className="flex items-center gap-1.5 justify-between">
                  <span>{col.label}</span>
                  {col.isAcf && (
                    <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30 font-mono">
                      ACF
                    </span>
                  )}
                </div>
              </th>
            ))}

            {/* Actions Col */}
            <th className="p-2.5 w-28 text-center bg-[#21262d] border-l border-[#2d323b] sticky left-0 z-30 shadow-md">
              عملیات
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-[#2d323b] bg-[#0f1115] text-[#e2e8f0]">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <tr key={`sk-row-${i}`} className="animate-pulse border-b border-[#2d323b] bg-[#14171d] h-11">
                <td className="p-2.5 text-center border-l border-[#2d323b]">
                  <div className="w-4 h-4 bg-[#282e38] rounded mx-auto" />
                </td>
                {columns.filter((c) => c.visible).map((col) => (
                  <td key={`sk-col-${col.id}`} className="px-3 py-2.5 border-l border-[#2d323b]">
                    {col.id === 'image' ? (
                      <div className="w-8 h-8 bg-[#282e38] rounded" />
                    ) : col.id === 'name' ? (
                      <div className="w-3/4 h-3.5 bg-[#282e38] rounded" />
                    ) : (
                      <div className="w-1/2 h-3 bg-[#282e38] rounded" />
                    )}
                  </td>
                ))}
                <td className="p-2.5 text-center border-l border-[#2d323b] bg-[#16191f]">
                  <div className="w-14 h-5 bg-[#282e38] rounded mx-auto" />
                </td>
              </tr>
            ))
          ) : products.length === 0 ? (
            <tr>
              <td colSpan={columns.filter((c) => c.visible).length + 2} className="py-20 text-center text-slate-400">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#1c2128] border border-[#30363d] flex items-center justify-center text-slate-400">
                    <Tag className="w-6 h-6" />
                  </div>
                  <p className="font-bold text-sm text-slate-200">هیچ محصولی با این مشخصات یافت نشد.</p>
                  <p className="text-xs text-slate-400">عبارت جستجو یا فیلتر دسته‌بندی را بازنشانی کنید.</p>
                </div>
              </td>
            </tr>
          ) : (
            products.map((product, idx) => {
              const isSelected = selectedProductIds.includes(product.id);
              const hasRowChanges = isRowModified(product.id);
              const isSyncing = isSyncingProductId === product.id;

              return (
                <tr
                  key={product.id}
                  className={`group transition-colors h-11 border-b border-[#2d323b] ${
                    hasRowChanges
                      ? 'bg-amber-950/25 hover:bg-amber-950/40'
                      : isSelected
                      ? 'bg-emerald-950/25 hover:bg-emerald-950/40'
                      : idx % 2 === 0
                      ? 'bg-[#0f1115] hover:bg-[#1c2128]'
                      : 'bg-[#14171d] hover:bg-[#1c2128]'
                  }`}
                >
                  {/* Select Checkbox */}
                  <td className={`p-2 w-10 text-center border-l border-[#2d323b] ${pyClass}`}>
                    <div className="flex items-center justify-center gap-1">
                      {hasRowChanges && (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="تغییرات ذخیره‌نشده" />
                      )}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelectProduct(product.id)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer"
                      />
                    </div>
                  </td>

                  {/* Columns Data Rendering */}
                  {columns.filter((c) => c.visible).map((col) => {
                    const isAcf = !!col.isAcf;
                    const fieldKey = isAcf ? (col.acfKey || col.id) : col.id;
                    const val = getDisplayValue(product, fieldKey, isAcf);
                    const modified = isFieldModified(product.id, fieldKey, isAcf);
                    const isEditing =
                      editingCell?.productId === product.id &&
                      editingCell?.field === fieldKey &&
                      editingCell?.isAcf === isAcf;

                    return (
                      <td
                        key={col.id}
                        className={`px-2.5 border-l border-[#2d323b] relative ${pyClass} ${textClass} ${
                          modified ? 'bg-amber-500/15 font-semibold text-amber-300' : ''
                        }`}
                      >
                        {/* ID Column */}
                        {col.id === 'id' && (
                          <div className="font-mono text-slate-400 text-[11px] flex items-center justify-between">
                            <span>#{product.id}</span>
                            {product.permalink && (
                              <a
                                href={product.permalink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-500 hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="مشاهده محصول در وب‌سایت"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        )}

                        {/* Image Column */}
                        {col.id === 'image' && (
                          <div
                            onClick={() => onOpenDetailDrawer(product)}
                            className="flex items-center justify-center cursor-pointer group/img"
                          >
                            {product.images?.[0]?.src ? (
                              <img
                                src={product.images[0].src}
                                alt={product.name}
                                className="w-8 h-8 rounded object-cover border border-[#30363d] group-hover/img:scale-105 transition-transform bg-[#16191f]"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded bg-[#16191f] border border-[#30363d] flex items-center justify-center text-slate-500">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Editable Text Cell (Title, SKU, Prices, Stock Qty) */}
                        {['name', 'sku', 'regular_price', 'sale_price', 'stock_quantity'].includes(col.id) && (
                          <div>
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type={col.id === 'regular_price' || col.id === 'sale_price' || col.id === 'stock_quantity' ? 'number' : 'text'}
                                  value={tempValue}
                                  onChange={(e) => setTempValue(e.target.value)}
                                  onKeyDown={(e) => handleKeyDown(e, product.id, fieldKey, isAcf)}
                                  autoFocus
                                  className="w-full bg-[#1c2128] border border-emerald-500 rounded px-2 py-1 text-slate-100 text-xs focus:outline-none shadow-inner"
                                />
                                <button
                                  onClick={() => handleSaveEdit(product.id, fieldKey, isAcf)}
                                  className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded shrink-0"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => setEditingCell(null)}
                                  className="p-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded shrink-0"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() => handleStartEdit(product, fieldKey, val, isAcf)}
                                className="cursor-pointer hover:bg-[#1c2128] px-1.5 py-1 rounded border border-transparent hover:border-[#30363d] transition-all flex items-center justify-between group/cell"
                              >
                                <span className={col.id === 'name' ? 'font-medium text-slate-200 truncate max-w-[260px]' : col.id === 'sale_price' ? 'text-emerald-400 font-semibold' : ''}>
                                  {col.id === 'regular_price' || col.id === 'sale_price'
                                    ? val && val !== ''
                                      ? `${formatToman(val)} تومان`
                                      : col.id === 'sale_price'
                                      ? '— (بدون تخفیف)'
                                      : '0'
                                    : val || '—'}
                                </span>
                                <Edit2 className="w-3 h-3 text-slate-500 opacity-0 group-hover/cell:opacity-100 transition-opacity ml-1 flex-shrink-0" />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Stock Status Dropdown Cell */}
                        {col.id === 'stock_status' && (
                          <div className="relative">
                            <select
                              value={val}
                              onChange={(e) => onCellEdit(product.id, 'stock_status', e.target.value, false)}
                              className={`w-full bg-[#16191f] border text-xs px-2 py-1 rounded cursor-pointer appearance-none ${
                                val === 'instock'
                                  ? 'border-emerald-500/40 text-emerald-400 bg-emerald-950/20'
                                  : val === 'outofstock'
                                  ? 'border-rose-500/40 text-rose-400 bg-rose-950/20'
                                  : 'border-amber-500/40 text-amber-400 bg-amber-950/20'
                              }`}
                            >
                              <option value="instock">موجود در انبار</option>
                              <option value="outofstock">ناموجود</option>
                              <option value="onbackorder">پیش‌خرید</option>
                            </select>
                            <ChevronDown className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                          </div>
                        )}

                        {/* Categories Cell */}
                        {col.id === 'categories' && (
                          <div className="flex flex-wrap gap-1">
                            {product.categories && product.categories.length > 0 ? (
                              product.categories.map((c) => (
                                <span
                                  key={c.id}
                                  className="text-[10px] bg-[#1c2128] text-slate-300 border border-[#30363d] px-2 py-0.5 rounded-md"
                                >
                                  {c.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-500 text-[11px]">بدون دسته‌بندی</span>
                            )}
                          </div>
                        )}

                        {/* Product Status Cell (Publish / Draft) */}
                        {col.id === 'status' && (
                          <select
                            value={val}
                            onChange={(e) => onCellEdit(product.id, 'status', e.target.value, false)}
                            className={`text-xs px-2 py-1 rounded bg-[#16191f] border appearance-none cursor-pointer ${
                              val === 'publish'
                                ? 'border-emerald-500/50 text-emerald-400'
                                : 'border-[#30363d] text-slate-400'
                            }`}
                          >
                            <option value="publish">منتشرشده</option>
                            <option value="draft">پیش‌نویس</option>
                            <option value="pending">در انتظار بررسی</option>
                          </select>
                        )}

                        {/* Custom ACF Field Cells */}
                        {isAcf && (
                          <div>
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={tempValue}
                                  onChange={(e) => setTempValue(e.target.value)}
                                  onKeyDown={(e) => handleKeyDown(e, product.id, fieldKey, true)}
                                  autoFocus
                                  className="w-full bg-[#1c2128] border border-purple-500 rounded px-2 py-1 text-purple-200 text-xs focus:outline-none"
                                />
                                <button
                                  onClick={() => handleSaveEdit(product.id, fieldKey, true)}
                                  className="p-1 bg-purple-600 text-white rounded shrink-0"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() => handleStartEdit(product, fieldKey, val, true)}
                                className="cursor-pointer hover:bg-purple-950/30 px-1.5 py-1 rounded border border-transparent hover:border-purple-800/60 transition-all flex items-center justify-between group/cell text-purple-200 font-mono text-[11px]"
                              >
                                <span className="truncate max-w-[140px]">{val !== '' && val !== null ? String(val) : '—'}</span>
                                <Edit2 className="w-3 h-3 text-purple-400 opacity-0 group-hover/cell:opacity-100 transition-opacity ml-1 flex-shrink-0" />
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}

                  {/* Actions Column */}
                  <td className={`p-2 w-28 text-center bg-[#16191f] group-hover:bg-[#1c2128] border-l border-[#2d323b] sticky left-0 z-10 shadow-md ${pyClass}`}>
                    <div className="flex items-center justify-center gap-1.5">
                      {/* Direct Single Product Sync Button */}
                      <button
                        onClick={() => onSingleProductSync(product)}
                        disabled={isSyncing}
                        className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded transition-all shadow-sm ${
                          hasRowChanges
                            ? 'bg-[#9e6a03] hover:bg-amber-600 text-white animate-pulse'
                            : 'bg-[#238636] hover:bg-[#2ea043] text-white border border-[#2ea043]'
                        }`}
                        title={hasRowChanges ? 'ارسال تغییرات این محصول به سایت' : 'همگام‌سازی تکی'}
                      >
                        {isSyncing ? (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Send className="w-3 h-3" />
                        )}
                        <span>{hasRowChanges ? 'ارسال' : 'آپدیت'}</span>
                      </button>

                      {/* Detail Drawer Trigger */}
                      <button
                        onClick={() => onOpenDetailDrawer(product)}
                        className="p-1 bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white rounded border border-[#30363d] transition-colors"
                        title="مشاهده و ویرایش جزئیات"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
