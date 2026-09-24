import React, { useState } from 'react';
import { WCCategory } from '../types';
import { X, Edit3, Percent, DollarSign, Tag, Check, ArrowDown, ArrowUp } from 'lucide-react';

interface BulkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  categories: WCCategory[];
  onApplyBulkEdit: (
    type: 'price_increase_percent' | 'price_decrease_percent' | 'price_fixed_set' | 'stock_status' | 'category_set',
    value: any
  ) => void;
}

export const BulkEditModal: React.FC<BulkEditModalProps> = ({
  isOpen,
  onClose,
  selectedCount,
  categories,
  onApplyBulkEdit,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'price' | 'stock' | 'category'>('price');
  const [priceOperation, setPriceOperation] = useState<'increase_pct' | 'decrease_pct' | 'fixed_set'>('increase_pct');
  const [priceValue, setPriceValue] = useState<string>('10');
  const [stockStatus, setStockStatus] = useState<'instock' | 'outofstock' | 'onbackorder'>('instock');
  const [categoryId, setCategoryId] = useState<string>(categories[0] ? categories[0].id.toString() : '');

  const handleApply = () => {
    if (activeTab === 'price') {
      const num = parseFloat(priceValue);
      if (isNaN(num)) return;

      if (priceOperation === 'increase_pct') {
        onApplyBulkEdit('price_increase_percent', num);
      } else if (priceOperation === 'decrease_pct') {
        onApplyBulkEdit('price_decrease_percent', num);
      } else {
        onApplyBulkEdit('price_fixed_set', num);
      }
    } else if (activeTab === 'stock') {
      onApplyBulkEdit('stock_status', stockStatus);
    } else if (activeTab === 'category') {
      const matched = categories.find((c) => c.id.toString() === categoryId);
      if (matched) {
        onApplyBulkEdit('category_set', matched);
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-100">ویرایش دسته‌جمعی ({selectedCount} محصول)</h2>
              <p className="text-xs text-slate-400">تغییر همزمان قیمت‌ها، موجودی انبار یا دسته‌بندی محصولات انتخاب‌شده.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 p-1">
          <button
            onClick={() => setActiveTab('price')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'price' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>تغییر قیمت‌ها</span>
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'stock' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>موجودی انبار</span>
          </button>
          <button
            onClick={() => setActiveTab('category')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'category' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>دسته‌بندی</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {activeTab === 'price' && (
            <div className="space-y-4">
              <label className="block text-xs font-semibold text-slate-300">نوع تغییر قیمت:</label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPriceOperation('increase_pct')}
                  className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                    priceOperation === 'increase_pct'
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ArrowUp className="w-4 h-4 text-emerald-400" />
                  <span>افزایش درصدی (%)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPriceOperation('decrease_pct')}
                  className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                    priceOperation === 'decrease_pct'
                      ? 'bg-rose-950/60 border-rose-500 text-rose-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ArrowDown className="w-4 h-4 text-rose-400" />
                  <span>کاهش درصدی (%)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPriceOperation('fixed_set')}
                  className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                    priceOperation === 'fixed_set'
                      ? 'bg-purple-950/60 border-purple-500 text-purple-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <DollarSign className="w-4 h-4 text-purple-400" />
                  <span>قیمت ثابت جدید</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {priceOperation === 'fixed_set' ? 'مبلغ جدید به تومان:' : 'مقدار درصد (مثلاً 15 برای ۱۵٪):'}
                </label>
                <input
                  type="number"
                  value={priceValue}
                  onChange={(e) => setPriceValue(e.target.value)}
                  placeholder="مثلاً 10"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'stock' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">تغییر وضعیت انبار محصولات انتخاب شده:</label>
              <select
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="instock">موجود در انبار (In Stock)</option>
                <option value="outofstock">ناموجود (Out of Stock)</option>
                <option value="onbackorder">پیش‌خرید (On Backorder)</option>
              </select>
            </div>
          )}

          {activeTab === 'category' && (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-300">انتخاب دسته‌بندی جدید:</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id.toString()}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            انصراف
          </button>

          <button
            onClick={handleApply}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-md shadow-emerald-950"
          >
            <Check className="w-4 h-4" />
            <span>اعمال روی {selectedCount} محصول در جدول</span>
          </button>
        </div>
      </div>
    </div>
  );
};
