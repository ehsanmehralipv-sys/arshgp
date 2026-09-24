import React, { useState } from 'react';
import { WCConnectionConfig } from '../types';
import { testConnection } from '../services/wcApi';
import {
  X,
  Globe,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  HelpCircle,
  Code2,
  Download,
  Package,
} from 'lucide-react';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: WCConnectionConfig;
  onSaveConfig: (newConfig: WCConnectionConfig) => void;
  onOpenPhpSnippetModal: () => void;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onOpenPhpSnippetModal,
}) => {
  if (!isOpen) return null;

  const [siteUrl, setSiteUrl] = useState(config.siteUrl || '');
  const [consumerKey, setConsumerKey] = useState(config.consumerKey || '');
  const [consumerSecret, setConsumerSecret] = useState(config.consumerSecret || '');
  const [isDemoMode, setIsDemoMode] = useState(config.isDemoMode);
  const [batchSize, setBatchSize] = useState<number>(config.batchSize || 50);
  const [requestDelay, setRequestDelay] = useState<number>(config.requestDelay || 150);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    totalProducts?: number;
  } | null>(null);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const res = await testConnection({
        siteUrl,
        consumerKey,
        consumerSecret,
        useProxy: true,
        isDemoMode,
        batchSize,
        requestDelay,
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'خطای غیرمنتظره در تست اتصال',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSaveConfig({
      siteUrl,
      consumerKey,
      consumerSecret,
      useProxy: true,
      isDemoMode,
      batchSize,
      requestDelay,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-100">تنظیمات اتصال به وردپرس / ووکامرس</h2>
              <p className="text-xs text-slate-400">آدرس سایت و کلیدهای API REST ووکامرس را وارد کنید.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Demo Mode Toggle */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 font-bold text-xs text-amber-400">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>حالت آزمایشی (Demo Mode)</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                بدون نیاز به اتصال واقعی، با دیتای نمونه دیجی‌کالا/وردپرس کار کنید.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isDemoMode}
                onChange={(e) => setIsDemoMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {!isDemoMode && (
            <div className="space-y-4 animate-fade-in">
              {/* Site URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center justify-between">
                  <span>آدرس وب‌سایت وردپرس (Site URL)</span>
                  <span className="text-[10px] text-slate-500">مثال: https://myshop.com</span>
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="url"
                    value={siteUrl}
                    onChange={(e) => setSiteUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Consumer Key */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Consumer Key (کلید عمومی ووکامرس)
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={consumerKey}
                    onChange={(e) => setConsumerKey(e.target.value)}
                    placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Consumer Secret */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Consumer Secret (کلید خصوصی ووکامرس)
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={consumerSecret}
                    onChange={(e) => setConsumerSecret(e.target.value)}
                    placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Extraction Speed & Stability Setting */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">تنظیمات بهینه‌سازی استخراج محصولات زیاد:</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                    ضد هنگ و تایم‌اوت
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBatchSize(25);
                      setRequestDelay(250);
                    }}
                    className={`p-2 rounded-lg border text-right transition-all ${
                      batchSize === 25
                        ? 'bg-purple-950/50 border-purple-500 text-purple-200 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-[11px] font-bold">۲۵ محصول (سبک)</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">برای هاست‌های اشتراکی و کند</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBatchSize(50);
                      setRequestDelay(150);
                    }}
                    className={`p-2 rounded-lg border text-right transition-all ${
                      batchSize === 50
                        ? 'bg-purple-950/50 border-purple-500 text-purple-200 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-[11px] font-bold text-emerald-400">۵۰ محصول (پیشنهادی)</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">بهترین پایداری و سرعت</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBatchSize(100);
                      setRequestDelay(100);
                    }}
                    className={`p-2 rounded-lg border text-right transition-all ${
                      batchSize === 100
                        ? 'bg-purple-950/50 border-purple-500 text-purple-200 shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-[11px] font-bold">۱۰۰ محصول (سریع)</div>
                    <div className="text-[9px] text-slate-500 mt-0.5">برای سرورهای اختصاصی/VPS</div>
                  </button>
                </div>
              </div>

              {/* How to get credentials help */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="font-semibold text-slate-300 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                  <span>راهنمای دریافت کلیدهای ووکامرس:</span>
                </div>
                <p>
                  در پنل وردپرس به مسیر <strong className="text-slate-200">ووکامرس ← پیکربندی ← پیشرفته ← REST API</strong> بروید و یک کلید جدید با دسترسی <strong className="text-emerald-400">خواندنی/نوشتنی (Read/Write)</strong> ایجاد کنید.
                </p>
              </div>

              {/* Download WordPress Plugin Box */}
              <div className="bg-gradient-to-r from-purple-950/40 to-slate-900 border border-purple-500/30 p-3.5 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <Package className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <span className="font-bold text-slate-200 block">دانلود افزونه همگام‌ساز وردپرس</span>
                    <span className="text-[10px] text-slate-400">پشتیبانی کامل از فیلدهای ACF، ساختار متاداده و رفع خطای CORS</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onOpenPhpSnippetModal}
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>دانلود ZIP</span>
                </button>
              </div>

              {/* Test Connection Button */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
                  <span>تست ارتباط با وردپرس</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenPhpSnippetModal}
                  className="text-xs text-purple-400 hover:underline flex items-center gap-1"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>راهنما و کد PHP</span>
                </button>
              </div>

              {/* Test Result Alert */}
              {testResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                    testResult.success
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold">{testResult.message}</p>
                    {testResult.totalProducts !== undefined && (
                      <p className="text-[11px] opacity-80 mt-1">
                        تعداد کل محصولات موجود در سایت شما: {testResult.totalProducts} عدد
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            انصراف
          </button>

          <button
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all shadow-md shadow-purple-950"
          >
            ذخیره و اعمال تنظیمات
          </button>
        </div>
      </div>
    </div>
  );
};
