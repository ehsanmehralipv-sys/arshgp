import React, { useState } from 'react';
import {
  Sparkles,
  PlusCircle,
  Eye,
  MousePointer,
  TrendingUp,
  Flame,
  CheckCircle2,
  Tag,
  FileText,
  DollarSign,
  Layers,
  Search,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { ContentGapOpportunity } from '../../types/seoTypes';
import { WCProduct, WCCategory } from '../../types';

interface ContentGapViewProps {
  gaps: ContentGapOpportunity[];
  categories: WCCategory[];
  onCreateProductFromGap: (proposed: any) => Promise<void>;
  isCreating: boolean;
}

export const ContentGapView: React.FC<ContentGapViewProps> = ({
  gaps,
  categories,
  onCreateProductFromGap,
  isCreating,
}) => {
  const [selectedGap, setSelectedGap] = useState<ContentGapOpportunity | null>(null);
  const [createdGapIds, setCreatedGapIds] = useState<string[]>([]);
  const [previewProduct, setPreviewProduct] = useState<any>(null);

  const handleOpenCreator = (gap: ContentGapOpportunity) => {
    setSelectedGap(gap);
    const p = gap.aiProposedProduct;
    if (p) {
      setPreviewProduct({
        name: p.name,
        regular_price: p.regular_price,
        short_description: p.short_description,
        description: p.description,
        categories: [{ id: 0, name: gap.categoryName }],
        meta_data: [
          { key: 'rank_math_focus_keyword', value: p.focusKeyword },
          { key: 'rank_math_title', value: p.seoTitle },
          { key: 'rank_math_description', value: p.metaDescription },
        ],
      });
    }
  };

  const handleSaveProduct = async () => {
    if (!previewProduct || !selectedGap) return;
    try {
      await onCreateProductFromGap(previewProduct);
      setCreatedGapIds((prev) => [...prev, selectedGap.id]);
      setSelectedGap(null);
      setPreviewProduct(null);
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-violet-950/40 via-indigo-950/30 to-[#181b24] border border-violet-800/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center text-violet-400 flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
              فرصت‌های محتوایی و کوئری‌های گمشده (Content Gap Opportunities)
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              کوئری‌ها و عبارات پرجستجویی که در سرچ کنسول ایمپرشن بالایی دریافت می‌کنند اما هنوز
              صفحه یا محصول اختصاصی برای آن‌ها نساخته‌اید. با ۱ کلیک هوش مصنوعی صفحه محصول را برای
              شما می‌سازد!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-xl bg-violet-500/10 text-violet-300 border border-violet-500/20 flex-shrink-0">
          <Flame className="w-4 h-4 text-amber-400" />
          <span>{gaps.length} فرصت طلایی رشد ترافیک</span>
        </div>
      </div>

      {/* Grid of Opportunities */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gaps.map((gap) => {
          const isDone = createdGapIds.includes(gap.id);
          return (
            <div
              key={gap.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isDone
                  ? 'bg-emerald-950/15 border-emerald-800/40'
                  : 'bg-[#181b22] border-slate-800 hover:border-violet-500/40 shadow-sm'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/20 font-medium">
                    {gap.categoryName}
                  </span>
                  <div className="flex items-center gap-1 text-amber-400 text-xs font-bold font-mono">
                    <Flame className="w-3.5 h-3.5" />
                    <span>امتیاز فرصت: {gap.opportunityScore}/100</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5 leading-snug">
                    <Search className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span>«{gap.query}»</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1.5">
                    پیشنهاد AI: ساخت محصول جدید با کلمه کلیدی «{gap.aiProposedProduct?.focusKeyword || gap.query}»
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/60 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">جستجو در گوگل</span>
                    <span className="font-mono font-bold text-sky-400 flex items-center gap-1 mt-0.5">
                      <Eye className="w-3 h-3" />
                      {gap.impressions.toLocaleString('fa-IR')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">پتانسیل کلیک ماهانه</span>
                    <span className="font-mono font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                      <MousePointer className="w-3 h-3" />
                      +{gap.estimatedMonthlyClicks.toLocaleString('fa-IR')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/60">
                {isDone ? (
                  <div className="w-full py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>محصول ساخته و به شیت اضافه شد</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleOpenCreator(gap)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-violet-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>ساخت فوری محصول با هوش مصنوعی</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Product Creator Review Modal */}
      {selectedGap && previewProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in overflow-y-auto">
          <div className="bg-[#12141a] border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-[#181b24]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-400" />
                <h3 className="font-bold text-sm sm:text-base text-white">
                  پیش‌نمایش محصول تولید شده توسط AI
                </h3>
              </div>
              <button
                onClick={() => setSelectedGap(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold block">نام محصول:</label>
                <input
                  type="text"
                  value={previewProduct.name}
                  onChange={(e) =>
                    setPreviewProduct({ ...previewProduct, name: e.target.value })
                  }
                  className="w-full bg-[#181b24] border border-slate-700 rounded-xl p-2.5 text-white font-medium focus:border-violet-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold block">قیمت پیشنهادی (تومان):</label>
                  <input
                    type="text"
                    value={previewProduct.regular_price}
                    onChange={(e) =>
                      setPreviewProduct({ ...previewProduct, regular_price: e.target.value })
                    }
                    className="w-full bg-[#181b24] border border-slate-700 rounded-xl p-2.5 text-emerald-400 font-mono font-bold focus:border-violet-500 outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-400 font-semibold block">دسته‌بندی:</label>
                  <input
                    type="text"
                    value={selectedGap.categoryName}
                    disabled
                    className="w-full bg-[#181b24]/50 border border-slate-800 rounded-xl p-2.5 text-slate-300 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold block">توضیحات کوتاه:</label>
                <textarea
                  rows={2}
                  value={previewProduct.short_description}
                  onChange={(e) =>
                    setPreviewProduct({ ...previewProduct, short_description: e.target.value })
                  }
                  className="w-full bg-[#181b24] border border-slate-700 rounded-xl p-2.5 text-slate-200 focus:border-violet-500 outline-none leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 font-semibold block">توضیحات کامل سئوشده:</label>
                <textarea
                  rows={5}
                  value={previewProduct.description}
                  onChange={(e) =>
                    setPreviewProduct({ ...previewProduct, description: e.target.value })
                  }
                  className="w-full bg-[#181b24] border border-slate-700 rounded-xl p-2.5 text-slate-200 font-mono text-[11px] focus:border-violet-500 outline-none leading-relaxed"
                />
              </div>

              <div className="p-3 bg-violet-950/20 border border-violet-800/40 rounded-xl text-violet-200 flex items-center gap-2">
                <Tag className="w-4 h-4 text-violet-400 flex-shrink-0" />
                <span>
                  کلمه کلیدی رنک‌مث: <strong>«{selectedGap.aiProposedProduct?.focusKeyword}»</strong>
                </span>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-[#181b24] flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedGap(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveProduct}
                disabled={isCreating}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isCreating ? 'در حال ثبت...' : 'ثبت و افزودن به فروشگاه و شیت'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
