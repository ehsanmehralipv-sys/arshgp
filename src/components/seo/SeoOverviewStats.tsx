import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  MousePointer,
  Eye,
  Percent,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Search,
  Sparkles,
} from 'lucide-react';
import { PageSeoInsight } from '../../types/seoTypes';

interface SeoOverviewStatsProps {
  insights: PageSeoInsight[];
  onSelectFilterTab: (filter: 'all' | 'drops' | 'gains' | 'strike_zone' | 'needs_index') => void;
  activeFilter: string;
}

export const SeoOverviewStats: React.FC<SeoOverviewStatsProps> = ({
  insights,
  onSelectFilterTab,
  activeFilter,
}) => {
  const totalClicks = insights.reduce((sum, i) => sum + i.clicks, 0);
  const prevClicks = insights.reduce((sum, i) => sum + i.previousClicks, 0);
  const clicksDelta = prevClicks > 0 ? Math.round(((totalClicks - prevClicks) / prevClicks) * 100) : 0;

  const totalImpressions = insights.reduce((sum, i) => sum + i.impressions, 0);
  const prevImpressions = insights.reduce((sum, i) => sum + i.previousImpressions, 0);
  const impressionsDelta =
    prevImpressions > 0 ? Math.round(((totalImpressions - prevImpressions) / prevImpressions) * 100) : 0;

  const avgCtr =
    totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  const avgPosition =
    insights.length > 0
      ? Math.round((insights.reduce((sum, i) => sum + i.averagePosition, 0) / insights.length) * 10) / 10
      : 0;

  const dropsCount = insights.filter((i) => i.positionChange <= -1.0).length;
  const gainsCount = insights.filter((i) => i.positionChange >= 1.0).length;
  const strikeZoneCount = insights.filter((i) => i.averagePosition >= 7.0 && i.averagePosition <= 20.0).length;
  const needsIndexCount = insights.filter((i) => i.indexStatus !== 'INDEXED').length;

  return (
    <div className="space-y-4">
      {/* Top 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Clicks */}
        <div className="bg-[#181b22] border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-indigo-500/50 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <MousePointer className="w-3.5 h-3.5 text-indigo-400" />
              کلیک‌های سرچ کنسول (۲۸ روز)
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium flex items-center gap-0.5 ${
                clicksDelta >= 0
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {clicksDelta >= 0 ? '+' : ''}
              {clicksDelta}%
              {clicksDelta >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              {totalClicks.toLocaleString('fa-IR')}
            </span>
            <span className="text-xs text-slate-500 font-normal">کلیک ارگانیک</span>
          </div>
          <div className="w-full bg-slate-800/60 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(15, (totalClicks / (prevClicks || 1)) * 50))}%` }}
            />
          </div>
        </div>

        {/* Impressions */}
        <div className="bg-[#181b22] border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-sky-500/50 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              مجموع نمایش در گوگل (Impressions)
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-mono font-medium flex items-center gap-0.5 ${
                impressionsDelta >= 0
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {impressionsDelta >= 0 ? '+' : ''}
              {impressionsDelta}%
              {impressionsDelta >= 0 ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              {totalImpressions.toLocaleString('fa-IR')}
            </span>
            <span className="text-xs text-slate-500 font-normal">نمایش</span>
          </div>
          <div className="w-full bg-slate-800/60 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-sky-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, Math.max(20, (totalImpressions / (prevImpressions || 1)) * 50))}%` }}
            />
          </div>
        </div>

        {/* Average CTR */}
        <div className="bg-[#181b22] border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-amber-500/50 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-amber-400" />
              میانگین نرخ کلیک (CTR)
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              هدف: &gt; ۵٪
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              {avgCtr.toFixed(2)}%
            </span>
            <span className="text-xs text-slate-500 font-normal">نرخ ورود کاربر</span>
          </div>
          <div className="w-full bg-slate-800/60 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, avgCtr * 15)}%` }}
            />
          </div>
        </div>

        {/* Average Position */}
        <div className="bg-[#181b22] border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-500/50 transition-all shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              میانگین رتبه در گوگل (Position)
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              صفحه ۱ و ۲
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400 tracking-tight">
              {avgPosition.toFixed(1)}
            </span>
            <span className="text-xs text-slate-500 font-normal">جایگاه میانگین</span>
          </div>
          <div className="w-full bg-slate-800/60 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-700"
              style={{ width: `${Math.max(10, 100 - avgPosition * 4)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Actionable Filter Tabs for Drops, Gains, Strike Zone, Index Needs */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/60">
        <button
          onClick={() => onSelectFilterTab('all')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            activeFilter === 'all'
              ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
              : 'bg-[#181b22] text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          <span>همه صفحات ({insights.length})</span>
        </button>

        <button
          onClick={() => onSelectFilterTab('drops')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            activeFilter === 'drops'
              ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30 font-semibold'
              : 'bg-[#181b22] text-rose-400 hover:bg-rose-950/30 border border-rose-500/30'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          <span>افت رتبه داشته‌ها ({dropsCount})</span>
          {dropsCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => onSelectFilterTab('gains')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            activeFilter === 'gains'
              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
              : 'bg-[#181b22] text-emerald-400 hover:bg-emerald-950/30 border border-emerald-500/30'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>بهبود رتبه داشته‌ها ({gainsCount})</span>
        </button>

        <button
          onClick={() => onSelectFilterTab('strike_zone')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            activeFilter === 'strike_zone'
              ? 'bg-amber-600 text-white shadow-sm shadow-amber-600/30'
              : 'bg-[#181b22] text-amber-400 hover:bg-amber-950/30 border border-amber-500/30'
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>فرصت‌های طلایی رتبه ۸ تا ۲۰ ({strikeZoneCount})</span>
        </button>

        <button
          onClick={() => onSelectFilterTab('needs_index')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
            activeFilter === 'needs_index'
              ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30'
              : 'bg-[#181b22] text-purple-400 hover:bg-purple-950/30 border border-purple-500/30'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>نیازمند درخواست ایندکس ({needsIndexCount})</span>
        </button>
      </div>
    </div>
  );
};
