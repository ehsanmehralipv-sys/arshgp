import React, { useState } from 'react';
import {
  Sparkles,
  Layers,
  Percent,
  Code,
  ShieldCheck,
  Check,
  Copy,
  ExternalLink,
  Flame,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Globe,
  Settings,
} from 'lucide-react';
import { CannibalizationIssue, GSCConnectionConfig } from '../../types/seoTypes';

interface SeoToolsViewProps {
  cannibalizations: CannibalizationIssue[];
  config: GSCConnectionConfig;
  onSaveConfig: (config: GSCConnectionConfig) => void;
  onRefreshData: () => void;
}

export const SeoToolsView: React.FC<SeoToolsViewProps> = ({
  cannibalizations,
  config,
  onSaveConfig,
  onRefreshData,
}) => {
  const [activeSubTool, setActiveSubTool] = useState<'cannibal' | 'ctr' | 'schema' | 'config'>('cannibal');
  const [copiedCode, setCopiedCode] = useState(false);

  // Local config form state
  const [localConfig, setLocalConfig] = useState<GSCConnectionConfig>({ ...config });

  const sampleSchema = `{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "آیا محصولات دارای گارانتی معتبر هستند؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "بله، تمام کالاها با گارانتی اصالت و سلامت فیزیکی با مهلت تست ۷ روزه ارسال می‌شوند."
      }
    },
    {
      "@type": "Question",
      "name": "زمان ارسال سفارشات چقدر است؟",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "ارسال با پست پیشتاز بین ۲۴ الی ۴۸ ساعت کاری و در تهران بصورت تحویل فوری انجام می‌گردد."
      }
    }
  ]
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleSchema);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(localConfig);
    onRefreshData();
  };

  return (
    <div className="space-y-6">
      {/* Sub-tools Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTool('cannibal')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTool === 'cannibal'
              ? 'bg-rose-600/20 text-rose-300 border border-rose-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>هم‌نوع‌خواری کلمات کلیدی ({cannibalizations.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTool('ctr')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTool === 'ctr'
              ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>بهینه‌ساز عنوان و نرخ کلیک (CTR Booster)</span>
        </button>

        <button
          onClick={() => setActiveSubTool('schema')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTool === 'schema'
              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>سازنده اسکیما FAQ Schema</span>
        </button>

        <button
          onClick={() => setActiveSubTool('config')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTool === 'config'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>تنظیمات سرچ کنسول و آنالیتیکس</span>
        </button>
      </div>

      {/* 1. Cannibalization Tab */}
      {activeSubTool === 'cannibal' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40 text-rose-200">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              تشخیص هم‌نوع‌خواری و رقابت داخلی صفحات (Keyword Cannibalization)
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              وقتی چند صفحه از سایت شما برای یک کوئری مشترک در گوگل رقابت می‌کنند، اعتبار سئو تقسیم
              شده و مانع رسیدن به رتبه ۱ می‌شود. هوش مصنوعی راهکار ادغام و تفکیک را مشخص می‌کند.
            </p>
          </div>

          <div className="space-y-4">
            {cannibalizations.map((item) => (
              <div key={item.id} className="p-5 rounded-xl bg-[#181b22] border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <span>کلمه کلیدی درگیر:</span>
                    <strong className="text-rose-400 font-mono">«{item.query}»</strong>
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {item.totalImpressions.toLocaleString('fa-IR')} نمایش در گوگل
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {item.competingPages.map((page, pIdx) => (
                    <div key={pIdx} className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200 truncate max-w-[200px]">
                          {page.title}
                        </span>
                        <span className="font-mono text-amber-400 font-bold">
                          رتبه: {page.position}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span>کلیک: {page.clicks}</span>
                        <span>CTR: {page.ctr}%</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800/80 text-xs space-y-1">
                  <span className="text-indigo-400 font-bold block">تحلیل و راهکار هوش مصنوعی:</span>
                  <p className="text-slate-300 leading-relaxed">{item.aiDiagnosis}</p>
                  <p className="text-emerald-300 mt-1 font-medium">اقدام پیشنهادی: {item.recommendedAction}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. CTR Booster Tab */}
      {activeSubTool === 'ctr' && (
        <div className="p-5 rounded-2xl bg-[#181b22] border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            فرمول‌های بهینه‌سازی عنوان برای صفحات با CTR پایین
          </h3>
          <p className="text-xs text-slate-300">
            عناوینی که دارای کلمات محرک (تخفیف، راهنما، اصل، ارسال فوری) و ایموجی هستند تا ۳۰۰٪ نرخ
            کلیک بیشتری از نتایج گوگل کسب می‌کنند.
          </p>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-200">فرمول ۱: [نام محصول] اصل + راهنمای خرید و مقایسه قیمت ۱۴۰۳</span>
              <span className="text-emerald-400 font-mono text-[11px]">+۴۵٪ CTR</span>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-200">فرمول ۲: خرید [نام محصول] با گارانتی شرکتی و ارسال فوری</span>
              <span className="text-emerald-400 font-mono text-[11px]">+۳۸٪ CTR</span>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-200">فرمول ۳: نقد و بررسی تخصصی [نام محصول] (آیا ارزش خرید دارد؟)</span>
              <span className="text-emerald-400 font-mono text-[11px]">+۵۲٪ CTR</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Schema JSON-LD Generator */}
      {activeSubTool === 'schema' && (
        <div className="p-5 rounded-2xl bg-[#181b22] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Code className="w-4 h-4 text-indigo-400" />
              کد آماده FAQPage JSON-LD Schema
            </h3>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'کپی شد!' : 'کپی کد اسکیما'}</span>
            </button>
          </div>

          <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 font-mono text-xs overflow-x-auto text-left dir-ltr">
            {sampleSchema}
          </pre>
        </div>
      )}

      {/* 4. GSC & GA4 Settings */}
      {activeSubTool === 'config' && (
        <form onSubmit={handleSaveSettings} className="p-5 rounded-2xl bg-[#181b22] border border-slate-800 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-indigo-400" />
            تنظیمات اتصال Google Search Console و Google Analytics 4
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold block">آدرس Property سرچ کنسول:</label>
              <input
                type="text"
                value={localConfig.propertyUrl}
                onChange={(e) => setLocalConfig({ ...localConfig, propertyUrl: e.target.value })}
                placeholder="https://myshop.ir"
                className="w-full bg-[#12141a] border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-400 font-semibold block">شناسه GA4 Property ID (اختیاری):</label>
              <input
                type="text"
                value={localConfig.ga4PropertyId || ''}
                onChange={(e) => setLocalConfig({ ...localConfig, ga4PropertyId: e.target.value })}
                placeholder="G-XXXXXXX یا ۳۴۹۲۸۳۴"
                className="w-full bg-[#12141a] border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-slate-400 font-semibold block">بازه زمانی آنالیز داده‌ها:</label>
            <select
              value={localConfig.dateRange}
              onChange={(e: any) => setLocalConfig({ ...localConfig, dateRange: e.target.value })}
              className="w-full bg-[#12141a] border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="7d">۷ روز اخیر (کوتاه‌مدت)</option>
              <option value="28d">۲۸ روز اخیر (استاندارد سرچ کنسول)</option>
              <option value="3m">۳ ماه اخیر (روند میان‌مدت)</option>
              <option value="6m">۶ ماه اخیر</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              ذخیره و همگام‌سازی اطلاعات سئو
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
