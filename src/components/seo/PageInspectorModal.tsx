import React, { useState } from 'react';
import {
  X,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Search,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Clock,
  Send,
  HelpCircle,
  FileText,
  Tag,
  Flame,
  AlertCircle,
  RefreshCw,
  Check,
  Ban,
  Layers,
  Globe,
  Smartphone,
  Monitor,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { PageSeoInsight, SeoActionTask } from '../../types/seoTypes';
import { WCProduct } from '../../types';

interface PageInspectorModalProps {
  insight: PageSeoInsight;
  product?: WCProduct;
  isOpen: boolean;
  onClose: () => void;
  onRequestIndex: (url: string) => Promise<void>;
  onApplyContentPatch: (productId: number, patch: any) => Promise<void>;
  onAnalyzeWithAI: (insight: PageSeoInsight) => Promise<void>;
  isAnalyzing: boolean;
  isIndexRequesting: boolean;
}

export const PageInspectorModal: React.FC<PageInspectorModalProps> = ({
  insight,
  product,
  isOpen,
  onClose,
  onRequestIndex,
  onApplyContentPatch,
  onAnalyzeWithAI,
  isAnalyzing,
  isIndexRequesting,
}) => {
  const [activeTab, setActiveTab] = useState<'plan' | 'queries' | 'patch' | 'rankmath'>('plan');
  const [serpDevice, setSerpDevice] = useState<'desktop' | 'mobile'>('mobile');
  const [taskStatusMap, setTaskStatusMap] = useState<Record<string, string>>({});
  const [isPatchApplied, setIsPatchApplied] = useState(false);
  const [isPatchRejected, setIsPatchRejected] = useState(false);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  if (!isOpen) return null;

  const ai = insight.aiAnalysis;
  const tasks = ai?.tasks || [];
  const patch = tasks[0]?.suggestedContentPatch;

  const toggleTaskStatus = (taskId: string, currentStatus: string) => {
    const nextStatus =
      currentStatus === 'completed'
        ? 'pending'
        : currentStatus === 'pending'
        ? 'in_progress'
        : 'completed';
    setTaskStatusMap((prev) => ({ ...prev, [taskId]: nextStatus }));
  };

  const handleConfirmPatch = async () => {
    if (!patch) return;
    try {
      await onApplyContentPatch(insight.productId, patch);
      setIsPatchApplied(true);
    } catch (e) {}
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fade-in">
      <div
        className="bg-[#12141a] border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between bg-[#181b24]/90 gap-3">
          <div className="flex items-start gap-3.5 min-w-0">
            {insight.featuredImage ? (
              <img
                src={insight.featuredImage}
                alt={insight.productTitle}
                className="w-12 h-12 rounded-xl object-cover border border-slate-700 flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                <FileText className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white truncate max-w-md">
                  {insight.productTitle}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                  {insight.productSku || `#${insight.productId}`}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  {insight.categoryName}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                <a
                  href={insight.pageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-indigo-400 flex items-center gap-1 font-mono truncate max-w-xs sm:max-w-md"
                >
                  {insight.pageUrl}
                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                </a>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => onAnalyzeWithAI(insight)}
              disabled={isAnalyzing}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'در حال تحلیل AI...' : 'تحلیل مجدد هوش مصنوعی'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Highlights Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 sm:px-6 bg-[#151820] border-b border-slate-800/80 text-xs">
          <div className="flex flex-col">
            <span className="text-slate-400">رتبه میانگین سرچ کنسول</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-base font-bold font-mono text-white">
                {insight.averagePosition}
              </span>
              <span
                className={`text-[11px] font-mono px-1.5 py-0.2 rounded ${
                  insight.positionChange >= 0
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-rose-400 bg-rose-500/10'
                }`}
              >
                {insight.positionChange >= 0 ? '+' : ''}
                {insight.positionChange}
              </span>
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-slate-400">کلیک ۲۸ روز اخیر</span>
            <span className="text-base font-bold font-mono text-indigo-400 mt-0.5">
              {insight.clicks.toLocaleString('fa-IR')}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-slate-400">نمایش (Impressions)</span>
            <span className="text-base font-bold font-mono text-sky-400 mt-0.5">
              {insight.impressions.toLocaleString('fa-IR')}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-slate-400">امتیاز سئو رنک‌مث</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span
                className={`text-base font-bold font-mono ${
                  insight.rankMathScore >= 80
                    ? 'text-emerald-400'
                    : insight.rankMathScore >= 60
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {insight.rankMathScore}/100
              </span>
            </div>
          </div>

          <div className="flex flex-col col-span-2 sm:col-span-1 justify-center">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  insight.indexStatus === 'INDEXED' ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'
                }`}
              />
              <span className="text-slate-300 font-medium">
                {insight.indexStatus === 'INDEXED'
                  ? 'ایندکس شده در گوگل'
                  : 'نیازمند ایندکس مجدد'}
              </span>
            </div>
            <button
              onClick={() => onRequestIndex(insight.pageUrl)}
              disabled={isIndexRequesting}
              className="mt-1 text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium cursor-pointer"
            >
              <Send className="w-3 h-3" />
              <span>ارسال درخواست Indexing API</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 border-b border-slate-800 bg-[#12141a]">
          <button
            onClick={() => setActiveTab('plan')}
            className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'plan'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>برنامه عملیاتی و تسک‌های هوش مصنوعی ({tasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('queries')}
            className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'queries'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>کوئری‌های سرچ کنسول ({insight.queries.length})</span>
          </button>

          {patch && (
            <button
              onClick={() => setActiveTab('patch')}
              className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'patch'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>پیشنهاد آپدیت محتوایی AI</span>
              {!isPatchApplied && !isPatchRejected && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          )}

          <button
            onClick={() => setActiveTab('rankmath')}
            className={`pb-3 text-xs sm:text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'rankmath'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>پیش‌نمایش در نتایج گوگل (SERP)</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: AI Action Plan & Tasks */}
          {activeTab === 'plan' && (
            <div className="space-y-6">
              {/* AI Diagnostic Banner */}
              <div
                className={`p-4 rounded-xl border ${
                  insight.positionChange < -1.5
                    ? 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                    : insight.positionChange > 1.5
                    ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                    : 'bg-indigo-950/20 border-indigo-800/40 text-indigo-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-sm text-white">
                      تشخیص وضعیت و ریشه نوسانات رتبه توسط هوش مصنوعی
                    </h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                      {ai?.statusSummary || 'در حال آماده‌سازی تحلیل جامع...'}
                    </p>
                    {ai?.rootCause && (
                      <div className="mt-2.5 pt-2.5 border-t border-slate-700/50 text-xs">
                        <strong className="text-slate-200">ریشه اصلی: </strong>
                        <span className="text-slate-300">{ai.rootCause}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tasks Timeline with Start Date, Predicted Finish Date, and Post Check */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    برنامه زمان‌بندی اجرای تسک‌ها و پیش‌بینی بهبود رتبه
                  </h3>
                  <span className="text-xs text-slate-400">
                    برای تغییر وضعیت روی هر تسک کلیک کنید
                  </span>
                </div>

                <div className="space-y-3">
                  {tasks.map((task) => {
                    const currentStatus = taskStatusMap[task.id] || task.status;
                    return (
                      <div
                        key={task.id}
                        onClick={() => toggleTaskStatus(task.id, currentStatus)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer select-none ${
                          currentStatus === 'completed'
                            ? 'bg-emerald-950/15 border-emerald-800/40 opacity-75'
                            : currentStatus === 'in_progress'
                            ? 'bg-amber-950/15 border-amber-800/40'
                            : 'bg-[#181b24] border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div
                              className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                                currentStatus === 'completed'
                                  ? 'bg-emerald-500 border-emerald-400 text-white'
                                  : currentStatus === 'in_progress'
                                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                                  : 'border-slate-600 bg-slate-800/50 text-transparent'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4
                                  className={`text-sm font-semibold ${
                                    currentStatus === 'completed'
                                      ? 'line-through text-slate-400'
                                      : 'text-white'
                                  }`}
                                >
                                  {task.title}
                                </h4>
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                    task.impact === 'high'
                                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                  }`}
                                >
                                  اثرگذاری {task.impact === 'high' ? 'بالا' : 'متوسط'}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                                  {task.category === 'content_update'
                                    ? 'آپدیت محتوا'
                                    : task.category === 'faq_schema'
                                    ? 'اسکیما و FAQ'
                                    : task.category === 'meta_optimization'
                                    ? 'بهینه‌سازی متا'
                                    : 'تکنیکال'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                                {task.description}
                              </p>

                              {/* Timeline and Dates */}
                              <div className="flex items-center gap-4 mt-3 text-[11px] text-slate-400 flex-wrap bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                                  <span>تاریخ شروع: </span>
                                  <strong className="text-slate-200">{task.startDate}</strong>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                                  <span>پیش‌بینی اتمام: </span>
                                  <strong className="text-slate-200">
                                    {task.predictedFinishDate}
                                  </strong>
                                </div>
                                <div className="flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>تاریخ بازبینی نتایج (Post-Check): </span>
                                  <strong className="text-emerald-300">{task.postCheckDate}</strong>
                                </div>
                              </div>

                              {task.predictedRankImpact && (
                                <div className="mt-2 text-xs text-indigo-300 font-medium flex items-center gap-1.5">
                                  <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
                                  <span>پیش‌بینی تاثیر: {task.predictedRankImpact}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex-shrink-0 text-xs">
                            <span
                              className={`px-2.5 py-1 rounded-lg font-medium text-[11px] ${
                                currentStatus === 'completed'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : currentStatus === 'in_progress'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {currentStatus === 'completed'
                                ? 'تکمیل شده'
                                : currentStatus === 'in_progress'
                                ? 'در حال اجرا'
                                : 'در انتظار اقدام'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Search Console Queries */}
          {activeTab === 'queries' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  لیست کلمات و عباراتی که این صفحه با آن‌ها در گوگل ورودی و بازدید داشته است:
                </span>
                <span className="text-xs text-indigo-400 font-mono">
                  {insight.queries.length} کوئری فعال
                </span>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden bg-[#181b24]">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#14161e] text-slate-400 border-b border-slate-800 font-semibold">
                    <tr>
                      <th className="p-3">کوئری جستجو شده در گوگل</th>
                      <th className="p-3 text-center">کلیک</th>
                      <th className="p-3 text-center">ایمپرشن</th>
                      <th className="p-3 text-center">CTR</th>
                      <th className="p-3 text-center">رتبه در گوگل</th>
                      <th className="p-3 text-center">تغییرات رتبه</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {insight.queries.map((q, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3 font-medium text-slate-200 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                          <span>{q.query}</span>
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-white">
                          {q.clicks}
                        </td>
                        <td className="p-3 text-center font-mono text-slate-300">
                          {q.impressions.toLocaleString('fa-IR')}
                        </td>
                        <td className="p-3 text-center font-mono text-amber-400">
                          {q.ctr}%
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-indigo-300">
                          {q.position}
                        </td>
                        <td className="p-3 text-center font-mono">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-medium inline-flex items-center gap-0.5 ${
                              q.positionChange >= 0
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {q.positionChange >= 0 ? '+' : ''}
                            {q.positionChange}
                            {q.positionChange >= 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: AI Proposed Content Patch (Accept / Reject Workflow) */}
          {activeTab === 'patch' && patch && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-indigo-800/40 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    پیشنهاد بهینه‌سازی و آپدیت محتوایی توسط هوش مصنوعی
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    هوش مصنوعی با مقایسه کوئری‌های پرجستجوی سرچ کنسول و بررسی رقبای صفحه اول،
                    محتوای زیر را برای افزودن به محصول پیشنهاد داده است. می‌توانید آن را تایید یا
                    رد کنید.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {isPatchApplied ? (
                    <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      روی محصول اعمال شد
                    </span>
                  ) : isPatchRejected ? (
                    <span className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 text-xs font-medium flex items-center gap-1.5">
                      <Ban className="w-4 h-4" />
                      پیشنهاد رد شد
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsPatchRejected(true)}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
                      >
                        رد پیشنهاد
                      </button>
                      <button
                        onClick={handleConfirmPatch}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        تایید و اعمال روی محصول در ووکامرس
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Proposed Title & Keyword */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#181b24] border border-slate-800 space-y-2">
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-indigo-400" />
                    عنوان سئو جدید (SEO Title)
                  </span>
                  <div className="text-xs font-semibold text-white bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    {patch.seoTitle || insight.seoTitle}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#181b24] border border-slate-800 space-y-2">
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    کلمه کلیدی کانونی رنک‌مث (Focus Keyword)
                  </span>
                  <div className="text-xs font-semibold text-amber-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    {patch.focusKeyword || insight.focusKeyword}
                  </div>
                </div>
              </div>

              {/* Proposed Meta Description */}
              <div className="p-4 rounded-xl bg-[#181b24] border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400 font-medium">
                  توضیحات متا جذاب با نرخ کلیک بالا (Meta Description)
                </span>
                <p className="text-xs text-slate-200 bg-slate-900 p-3 rounded-lg border border-slate-800 leading-relaxed">
                  {patch.metaDescription || insight.seoDescription}
                </p>
              </div>

              {/* Proposed Content Addition */}
              {patch.contentAddition && (
                <div className="p-4 rounded-xl bg-[#181b24] border border-slate-800 space-y-2">
                  <span className="text-xs text-slate-400 font-medium">
                    پاراگراف تکمیلی و نقد و بررسی پیشنهادی AI برای تزریق به توضیحات
                  </span>
                  <div
                    className="text-xs text-slate-300 bg-slate-900 p-3 rounded-lg border border-slate-800 leading-relaxed prose prose-invert max-w-none"
                    dangerouslySetForwardInnerHtml={{ __html: patch.contentAddition }}
                  />
                </div>
              )}

              {/* Proposed FAQ Schema Accordions */}
              {patch.faqList && patch.faqList.length > 0 && (
                <div className="p-4 rounded-xl bg-[#181b24] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-emerald-400" />
                      سوالات متداول استخراج‌شده از سرچ کنسول (به همراه کد FAQ Schema)
                    </span>
                    <span className="text-[11px] text-emerald-400 font-mono">
                      نمایش به صورت آکاردئون در نتایج گوگل
                    </span>
                  </div>

                  <div className="space-y-2">
                    {patch.faqList.map((faq, fIdx) => (
                      <div
                        key={fIdx}
                        className="border border-slate-800 bg-slate-900 rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() =>
                            setExpandedFaqIndex(expandedFaqIndex === fIdx ? null : fIdx)
                          }
                          className="w-full p-3 text-right text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded bg-indigo-500/10 text-indigo-400 flex items-center justify-center text-[10px]">
                              {fIdx + 1}
                            </span>
                            {faq.question}
                          </span>
                          {expandedFaqIndex === fIdx ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                        {expandedFaqIndex === fIdx && (
                          <div className="p-3 pt-0 text-xs text-slate-300 leading-relaxed border-t border-slate-800/40">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Google SERP Preview */}
          {activeTab === 'rankmath' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  پیش‌نمایش ظاهر این صفحه در نتایج جستجوی گوگل (Google SERP):
                </span>
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setSerpDevice('mobile')}
                    className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all ${
                      serpDevice === 'mobile'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>موبایل</span>
                  </button>
                  <button
                    onClick={() => setSerpDevice('desktop')}
                    className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1 transition-all ${
                      serpDevice === 'desktop'
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>دسکتاپ</span>
                  </button>
                </div>
              </div>

              {/* SERP Box Simulation */}
              <div className="p-5 rounded-2xl bg-[#202124] border border-slate-700 text-right max-w-xl mx-auto shadow-xl">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                  <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">
                    🌐
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-slate-300 font-sans">
                      {insight.pageUrl.replace(/^https?:\/\//, '').split('/')[0]}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono truncate max-w-xs">
                      {insight.pageUrl}
                    </span>
                  </div>
                </div>

                <h4 className="text-base sm:text-lg text-[#8ab4f8] hover:underline font-medium cursor-pointer mt-1">
                  {insight.seoTitle || insight.productTitle}
                </h4>

                <p className="text-xs text-[#bdc1c6] mt-1.5 leading-relaxed">
                  {insight.seoDescription}
                </p>

                {/* Rich snippet stars & price if exists */}
                <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center gap-3 text-[11px] text-[#9aa0a6]">
                  <span className="text-amber-400 font-bold">★★★★★</span>
                  <span>رتبه: ۴.۸ (۳۴ نظر)</span>
                  {insight.price && (
                    <>
                      <span>•</span>
                      <span className="font-mono text-emerald-400">قیمت: {insight.price} تومان</span>
                    </>
                  )}
                  <span>•</span>
                  <span>موجود در انبار</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
