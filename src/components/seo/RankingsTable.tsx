import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  TrendingDown,
  TrendingUp,
  Sparkles,
  ExternalLink,
  Send,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ChevronDown,
  Layers,
  Flame,
  ArrowUpRight,
} from 'lucide-react';
import { PageSeoInsight } from '../../types/seoTypes';

interface RankingsTableProps {
  insights: PageSeoInsight[];
  onSelectInsight: (insight: PageSeoInsight) => void;
  onRequestIndex: (url: string) => Promise<void>;
  filterCategory: string;
  setFilterCategory: (cat: string) => void;
  categories: string[];
}

export const RankingsTable: React.FC<RankingsTableProps> = ({
  insights,
  onSelectInsight,
  onRequestIndex,
  filterCategory,
  setFilterCategory,
  categories,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'drop' | 'gain' | 'clicks' | 'impressions' | 'position' | 'score'>('drop');

  const filteredInsights = useMemo(() => {
    let list = [...insights];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          i.productTitle.toLowerCase().includes(q) ||
          i.pageUrl.toLowerCase().includes(q) ||
          i.productSku?.toLowerCase().includes(q) ||
          i.queries.some((query) => query.query.toLowerCase().includes(q))
      );
    }

    if (filterCategory) {
      list = list.filter((i) => i.categoryName === filterCategory);
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'drop') {
        // Most negative positionChange first
        return a.positionChange - b.positionChange;
      }
      if (sortBy === 'gain') {
        // Most positive positionChange first
        return b.positionChange - a.positionChange;
      }
      if (sortBy === 'clicks') {
        return b.clicks - a.clicks;
      }
      if (sortBy === 'impressions') {
        return b.impressions - a.impressions;
      }
      if (sortBy === 'position') {
        return a.averagePosition - b.averagePosition;
      }
      if (sortBy === 'score') {
        return b.rankMathScore - a.rankMathScore;
      }
      return 0;
    });

    return list;
  }, [insights, searchQuery, filterCategory, sortBy]);

  return (
    <div className="space-y-4">
      {/* Search & Sort Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#181b22] p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="جستجوی محصول، لینک، کلمه کلیدی یا شناسه کالا..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#12141a] border border-slate-700/80 rounded-lg pr-9 pl-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Category Filter */}
          <div className="relative">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-[#12141a] border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:border-indigo-500 outline-none cursor-pointer"
            >
              <option value="">همه دسته‌ها</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-[#12141a] border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">مرتب‌سازی:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="drop" className="bg-[#181b22]">بیشترین افت رتبه 🔻</option>
              <option value="gain" className="bg-[#181b22]">بیشترین رشد رتبه 🟢</option>
              <option value="clicks" className="bg-[#181b22]">بیشترین کلیک</option>
              <option value="impressions" className="bg-[#181b22]">بیشترین نمایش (Impression)</option>
              <option value="position" className="bg-[#181b22]">بهترین جایگاه (رتبه ۱)</option>
              <option value="score" className="bg-[#181b22]">امتیاز سئو رنک‌مث</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#181b22] shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#14161e] text-slate-400 border-b border-slate-800 font-semibold select-none">
              <tr>
                <th className="p-3.5 w-80">محصول / آدرس صفحه (URL)</th>
                <th className="p-3.5 text-center">امتیاز رنک‌مث</th>
                <th className="p-3.5 text-center">وضعیت ایندکس گوگل</th>
                <th className="p-3.5 text-center">کلیک (۲۸ روز)</th>
                <th className="p-3.5 text-center">نمایش (Impression)</th>
                <th className="p-3.5 text-center">نرخ کلیک (CTR)</th>
                <th className="p-3.5 text-center">جایگاه رتبه در گوگل</th>
                <th className="p-3.5 text-center">نوسان رتبه</th>
                <th className="p-3.5 text-center">اقدام و هوش مصنوعی</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredInsights.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-400">
                    موردی با این فیلتر یا جستجو یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredInsights.map((item) => {
                  const isDrop = item.positionChange <= -1.0;
                  const isGain = item.positionChange >= 1.0;

                  return (
                    <tr
                      key={item.productId}
                      className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                      onClick={() => onSelectInsight(item)}
                    >
                      {/* Product details */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          {item.featuredImage ? (
                            <img
                              src={item.featuredImage}
                              alt={item.productTitle}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-700/80 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 flex-shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-bold text-slate-200 group-hover:text-indigo-400 transition-colors truncate max-w-xs sm:max-w-sm">
                              {item.productTitle}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                              <span className="font-mono text-slate-500">
                                {item.productSku || `#${item.productId}`}
                              </span>
                              <span>•</span>
                              <span className="truncate max-w-[160px] font-mono text-slate-500">
                                {item.pageUrl.replace(/^https?:\/\//, '')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Rank Math Score */}
                      <td className="p-3.5 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full font-mono font-bold text-xs inline-block ${
                            item.rankMathScore >= 80
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : item.rankMathScore >= 60
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {item.rankMathScore}
                        </span>
                      </td>

                      {/* Index Status */}
                      <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex flex-col items-center gap-1">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                              item.indexStatus === 'INDEXED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.indexStatus === 'INDEXED' ? 'bg-emerald-400' : 'bg-amber-400'
                              }`}
                            />
                            {item.indexStatus === 'INDEXED' ? 'ایندکس شده' : 'نیازمند ایندکس'}
                          </span>
                          {item.indexStatus !== 'INDEXED' && (
                            <button
                              onClick={() => onRequestIndex(item.pageUrl)}
                              className="text-[10px] text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer"
                            >
                              ارسال به گوگل
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Clicks */}
                      <td className="p-3.5 text-center font-mono font-bold text-white">
                        {item.clicks.toLocaleString('fa-IR')}
                      </td>

                      {/* Impressions */}
                      <td className="p-3.5 text-center font-mono text-slate-300">
                        {item.impressions.toLocaleString('fa-IR')}
                      </td>

                      {/* CTR */}
                      <td className="p-3.5 text-center font-mono text-amber-400">
                        {item.ctr}%
                      </td>

                      {/* Average Position */}
                      <td className="p-3.5 text-center font-mono font-bold text-sm text-slate-100">
                        {item.averagePosition}
                      </td>

                      {/* Position Delta (Red Drop / Green Gain) */}
                      <td className="p-3.5 text-center font-mono">
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 ${
                            isDrop
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 font-semibold'
                              : isGain
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {item.positionChange > 0 ? '+' : ''}
                          {item.positionChange}
                          {isDrop && <TrendingDown className="w-3.5 h-3.5" />}
                          {isGain && <TrendingUp className="w-3.5 h-3.5" />}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => onSelectInsight(item)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all mx-auto cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>بررسی و برنامه AI</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
