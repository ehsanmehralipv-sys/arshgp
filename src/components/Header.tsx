import React, { useRef } from 'react';
import { WCConnectionConfig } from '../types';
import {
  FileSpreadsheet,
  Globe,
  RefreshCw,
  Download,
  Upload,
  Settings,
  PlusCircle,
  Code2,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Bookmark,
  FileJson,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Calendar,
} from 'lucide-react';

interface HeaderProps {
  config: WCConnectionConfig;
  pendingCount: number;
  totalProducts: number;
  isLoading: boolean;
  activeRefCode: string | null;
  currentAppView: 'sheet' | 'seo' | 'workspace';
  onSwitchView: (view: 'sheet' | 'seo' | 'workspace') => void;
  onOpenConnectionModal: () => void;
  onOpenNewProductModal: () => void;
  onOpenPhpSnippetModal: () => void;
  onOpenAcfManagerModal: () => void;
  onOpenReferenceModal: () => void;
  onQuickExportReference?: () => void;
  onQuickImportReference?: (file: File) => void;
  onResetToDemo?: () => void;
  onSyncAll: () => void;
  onRefreshData: () => void;
  onExportExcel: () => void;
  onImportExcelTrigger: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  pendingCount,
  totalProducts,
  isLoading,
  activeRefCode,
  currentAppView,
  onSwitchView,
  onOpenConnectionModal,
  onOpenNewProductModal,
  onOpenPhpSnippetModal,
  onOpenAcfManagerModal,
  onOpenReferenceModal,
  onQuickExportReference,
  onQuickImportReference,
  onResetToDemo,
  onSyncAll,
  onRefreshData,
  onExportExcel,
  onImportExcelTrigger,
}) => {
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  const handleJsonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onQuickImportReference) {
      onQuickImportReference(file);
    }
    if (jsonFileInputRef.current) {
      jsonFileInputRef.current.value = '';
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      {/* Top Banner / Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left: App Logo & Branding */}
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 p-0.5 shadow-lg flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-slate-100 tracking-tight">
                مدیریت اکسل و سئو محصولات
              </h1>
              <span className="text-[10px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                نسخه ۳.۰ + AI
              </span>
            </div>
            <p className="text-xs text-slate-400">
              ویرایش گروهی محصولات ووکامرس، فیلدهای ACF و هوش مصنوعی سئو سرچ کنسول
            </p>
          </div>
        </div>

        {/* View Switcher: Spreadsheet vs AI SEO Hub vs Google Workspace */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            type="button"
            onClick={() => onSwitchView('sheet')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentAppView === 'sheet'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>جدول اکسل محصولات</span>
          </button>

          <button
            type="button"
            onClick={() => onSwitchView('seo')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentAppView === 'seo'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-900/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>مرکز سئو و هوش مصنوعی</span>
            <span className="text-[9px] bg-amber-400 text-slate-950 px-1 py-0.2 rounded font-black">
              GSC
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSwitchView('workspace')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentAppView === 'workspace'
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-rose-600 text-white shadow-md shadow-blue-900/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-blue-300" />
            <span>Google Workspace</span>
            <span className="text-[9px] bg-blue-400 text-slate-950 px-1 py-0.2 rounded font-black">
              Drive / Gmail / Cal
            </span>
          </button>
        </div>

        {/* Center: Reference Code & Connection Status */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Active Reference Code Pill with Quick Actions */}
          <div className="flex items-center bg-gradient-to-r from-purple-950/80 to-slate-900 border border-purple-500/50 rounded-xl text-xs shadow-sm overflow-hidden">
            <button
              type="button"
              onClick={onOpenReferenceModal}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-purple-900/40 transition-colors group"
              title="مدیریت کد رفرنس، ذخیره‌سازی داده‌ها و جلوگیری از استخراج مجدد"
            >
              <Bookmark className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="text-slate-300 text-[11px]">کد رفرنس:</span>
              <span className="font-mono font-bold text-purple-300 tracking-wider">
                {activeRefCode || 'بدون کد (ایجاد)'}
              </span>
              <span className="text-[10px] bg-purple-500/20 text-purple-200 px-1.5 py-0.5 rounded-md font-semibold border border-purple-500/30">
                {totalProducts} محصول
              </span>
            </button>

            {/* Quick Export / Download Reference Button */}
            {onQuickExportReference && (
              <button
                type="button"
                onClick={onQuickExportReference}
                className="px-2 py-1.5 text-purple-300 hover:text-white hover:bg-purple-800/50 border-r border-purple-500/30 transition-colors"
                title="دانلود سریع فایل ریفر (.json)"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Quick Import Reference Button */}
            {onQuickImportReference && (
              <button
                type="button"
                onClick={() => jsonFileInputRef.current?.click()}
                className="px-2 py-1.5 text-indigo-300 hover:text-white hover:bg-indigo-800/50 border-r border-purple-500/30 transition-colors"
                title="ایمپورت سریع فایل ریفر (.json)"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Hidden JSON input for quick import */}
          <input
            ref={jsonFileInputRef}
            type="file"
            accept=".json"
            onChange={handleJsonChange}
            className="hidden"
          />

          {/* Connection Status Badge */}
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs">
            <Globe className="w-4 h-4 text-slate-400" />
            <span className="text-slate-300 hidden sm:inline">اتصال:</span>
            {config.isDemoMode ? (
              <span className="flex items-center gap-1.5 font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                حالت آزمایشی (Demo)
              </span>
            ) : config.siteUrl ? (
              <span className="flex items-center gap-1.5 font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 max-w-[160px] truncate" title={config.siteUrl}>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {config.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                متصل نشده
              </span>
            )}

            <button
              onClick={onOpenConnectionModal}
              className="mr-1 text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>تنظیمات</span>
            </button>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Reset to Demo / Fresh Start Button */}
          {onResetToDemo && (
            <button
              type="button"
              onClick={onResetToDemo}
              className="flex items-center gap-1.5 text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-rose-200 border border-rose-500/40 px-3 py-2 rounded-xl transition-all shadow-sm active:scale-95 group"
              title="ریست کامل پنل، بازگشت به حالت تستی (Demo) و باز شدن مجدد پنجره تنظیمات و ایمپورت"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400 group-hover:-rotate-90 transition-transform" />
              <span>ریست</span>
            </button>
          )}

          {/* PHP Plugin Download & ACF Helper Modal Button */}
          <button
            onClick={onOpenPhpSnippetModal}
            className="flex items-center gap-1.5 text-xs font-semibold bg-gradient-to-r from-purple-900/60 to-slate-800 hover:from-purple-800 hover:to-slate-700 text-purple-200 border border-purple-500/40 px-3 py-2 rounded-xl transition-all shadow-sm active:scale-95"
            title="دانلود فایل ZIP افزونه وردپرس جهت سینک کامل محصولات، فیلدهای ACF و رفع خطای CORS"
          >
            <Download className="w-4 h-4 text-purple-400 animate-pulse" />
            <span className="hidden sm:inline">دانلود افزونه وردپرس (ACF)</span>
          </button>

          {/* New Product Button */}
          <button
            onClick={onOpenNewProductModal}
            className="flex items-center gap-1.5 text-xs font-medium bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-3.5 py-2 rounded-xl transition-all shadow-md shadow-emerald-900/30 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>محصول جدید</span>
          </button>

          {/* Sync Pending Changes Button */}
          {pendingCount > 0 && (
            <button
              onClick={onSyncAll}
              disabled={isLoading}
              className="flex items-center gap-2 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2 rounded-xl transition-all shadow-lg shadow-amber-500/20 animate-bounce active:scale-95 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-slate-950 fill-current" />
              <span>ارسال به وردپرس ({pendingCount} تغییر)</span>
            </button>
          )}

          {/* Excel Export */}
          <button
            onClick={onExportExcel}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors border border-slate-700 flex items-center gap-1.5 text-xs"
            title="دانلود خروجی Excel (.xlsx)"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span className="hidden lg:inline font-medium">اکسپورت اکسل</span>
          </button>
        </div>
      </div>
    </header>
  );
};
