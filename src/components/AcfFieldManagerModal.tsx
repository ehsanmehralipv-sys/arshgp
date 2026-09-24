import React, { useState } from 'react';
import { ColumnDefinition } from '../types';
import { X, Layers, Plus, Trash2, Check, Sparkles } from 'lucide-react';

interface AcfFieldManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  columns: ColumnDefinition[];
  onAddAcfColumn: (key: string, label: string) => void;
  onRemoveColumn: (columnId: string) => void;
}

export const AcfFieldManagerModal: React.FC<AcfFieldManagerModalProps> = ({
  isOpen,
  onClose,
  columns,
  onAddAcfColumn,
  onRemoveColumn,
}) => {
  if (!isOpen) return null;

  const [acfKey, setAcfKey] = useState('');
  const [acfLabel, setAcfLabel] = useState('');

  const acfColumns = columns.filter((c) => c.isAcf);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!acfKey.trim()) return;
    const label = acfLabel.trim() || acfKey.trim();
    onAddAcfColumn(acfKey.trim(), label);
    setAcfKey('');
    setAcfLabel('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-100">مدیریت ستون‌های ACF (Advanced Custom Fields)</h2>
              <p className="text-xs text-slate-400">کلیدهای فیلد سفارشی ACF را به صورت ستون قابل ویرایش به شیت اضافه کنید.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Add New ACF Column Form */}
          <form onSubmit={handleAdd} className="bg-purple-950/20 border border-purple-800/40 p-4 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-purple-400" />
              <span>افزودن ستون فیلد سفارشی جدید</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-purple-300 mb-1">
                  کلید ACF در وردپرس <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={acfKey}
                  onChange={(e) => setAcfKey(e.target.value)}
                  placeholder="مثلاً: brand_name"
                  className="w-full bg-slate-950 border border-purple-800/60 rounded-xl px-3 py-1.5 text-xs text-purple-200 font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-purple-300 mb-1">عنوان ستون در اکسل (فارسی)</label>
                <input
                  type="text"
                  value={acfLabel}
                  onChange={(e) => setAcfLabel(e.target.value)}
                  placeholder="مثلاً: نام برند"
                  className="w-full bg-slate-950 border border-purple-800/60 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-purple-950 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن ستون به جدول شیت</span>
            </button>
          </form>

          {/* Existing ACF Columns List */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300">ستون‌های ACF فعال در شیت ({acfColumns.length}):</h3>

            {acfColumns.length === 0 ? (
              <p className="text-xs text-slate-500 bg-slate-950 p-3 rounded-xl border border-slate-800 text-center">
                هنوز هیچ ستون ACF اضافه نشده است. کلید دلخواه خود مانند brand_name یا warranty را در کادر بالا وارد کنید.
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {acfColumns.map((col) => (
                  <div
                    key={col.id}
                    className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800"
                  >
                    <div>
                      <span className="font-bold text-xs text-slate-200 ml-2">{col.label}</span>
                      <span className="font-mono text-[11px] text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                        acf: {col.acfKey}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemoveColumn(col.id)}
                      className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                      title="حذف این ستون"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
