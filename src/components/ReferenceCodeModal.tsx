import React, { useState, useEffect, useRef } from 'react';
import { ReferenceSnapshot, ReferenceSummary, WCProduct, WCCategory, WCConnectionConfig } from '../types';
import {
  saveSnapshot,
  getSnapshot,
  listSnapshots,
  deleteSnapshot,
  generateReferenceCode,
  setActiveReferenceCode,
  exportSnapshotFile,
  parseSnapshotFile,
} from '../services/snapshotService';
import {
  Bookmark,
  Copy,
  Check,
  RefreshCw,
  Plus,
  Trash2,
  Download,
  Upload,
  ArrowRight,
  Database,
  Calendar,
  Layers,
  Globe,
  Zap,
  X,
  Clock,
  FileJson,
  FileUp,
} from 'lucide-react';

interface ReferenceCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRefCode: string | null;
  currentProducts: WCProduct[];
  currentCategories: WCCategory[];
  currentConfig: WCConnectionConfig;
  currentPendingChanges: Record<number, Partial<WCProduct>>;
  onLoadSnapshot: (snapshot: ReferenceSnapshot) => void;
  onUpdateFromWooCommerce: (refCode: string) => void;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const ReferenceCodeModal: React.FC<ReferenceCodeModalProps> = ({
  isOpen,
  onClose,
  activeRefCode,
  currentProducts,
  currentCategories,
  currentConfig,
  currentPendingChanges,
  onLoadSnapshot,
  onUpdateFromWooCommerce,
  showToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [savedSnapshots, setSavedSnapshots] = useState<ReferenceSummary[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'load' | 'history'>('current');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshList = async () => {
    setIsLoadingList(true);
    try {
      const list = await listSnapshots();
      setSavedSnapshots(list);
    } catch (e) {
      console.warn(e);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshList();
      if (activeRefCode) {
        setInputCode(activeRefCode);
      }
    }
  }, [isOpen, activeRefCode]);

  if (!isOpen) return null;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    showToast('success', `کد رفرنس ${code} کپی شد.`);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveCurrentAsNew = async () => {
    if (currentProducts.length === 0) {
      showToast('error', 'محصولی در جدول برای ذخیره وجود ندارد.');
      return;
    }

    setIsActionLoading(true);
    const newCode = generateReferenceCode();
    const result = await saveSnapshot(newCode, {
      title: customTitle || `مجموعه ${currentProducts.length} محصول (${new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })})`,
      siteUrl: currentConfig.siteUrl,
      products: currentProducts,
      categories: currentCategories,
      config: currentConfig,
      pendingChanges: currentPendingChanges,
    });

    setIsActionLoading(false);
    if (result.success) {
      showToast('success', `کد رفرنس جدید "${newCode}" با موفقیت ایجاد و ذخیره شد.`);
      refreshList();
      onLoadSnapshot(result.snapshot);
    }
  };

  const handleSaveToActive = async () => {
    if (!activeRefCode) {
      handleSaveCurrentAsNew();
      return;
    }

    setIsActionLoading(true);
    const result = await saveSnapshot(activeRefCode, {
      title: customTitle || undefined,
      siteUrl: currentConfig.siteUrl,
      products: currentProducts,
      categories: currentCategories,
      config: currentConfig,
      pendingChanges: currentPendingChanges,
    });

    setIsActionLoading(false);
    if (result.success) {
      showToast('success', `اطلاعات روی کد رفرنس ${activeRefCode} بروزرسانی شد.`);
      refreshList();
    }
  };

  const handleLoadByCode = async (codeToLoad: string) => {
    const clean = codeToLoad.trim().toUpperCase();
    if (!clean) {
      showToast('error', 'لطفاً کد رفرنس را وارد کنید.');
      return;
    }

    setIsActionLoading(true);
    const snap = await getSnapshot(clean);
    setIsActionLoading(false);

    if (snap) {
      setActiveReferenceCode(snap.refCode);
      onLoadSnapshot(snap);
      showToast('success', `داده‌های کد رفرنس ${snap.refCode} شامل ${snap.productCount} محصول فوراً بارگذاری شد.`);
      onClose();
    } else {
      showToast('error', `کد رفرنس "${clean}" یافت نشد. لطفاً کد را بررسی نمایید.`);
    }
  };

  const handleDelete = async (refCode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`آیا از حذف کد رفرنس ${refCode} مطمئن هستید؟`)) {
      await deleteSnapshot(refCode);
      showToast('info', `کد رفرنس ${refCode} حذف شد.`);
      refreshList();
    }
  };

  const handleExportCurrent = () => {
    const code = activeRefCode || generateReferenceCode();
    const snapshot: ReferenceSnapshot = {
      refCode: code,
      title: `محصولات ${currentConfig.siteUrl || 'فروشگاه'} (${currentProducts.length} محصول)`,
      siteUrl: currentConfig.siteUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      productCount: currentProducts.length,
      products: currentProducts,
      categories: currentCategories,
      config: currentConfig,
      pendingChanges: currentPendingChanges,
    };
    exportSnapshotFile(snapshot);
    showToast('success', `فایل ریفر با کد ${code} دانلود شد.`);
  };

  const handleExportSnapshotItem = async (refCode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const snap = await getSnapshot(refCode);
    if (snap) {
      exportSnapshotFile(snap);
      showToast('success', `فایل ریفر ${refCode} دانلود شد.`);
    } else {
      showToast('error', 'خطا در بازیابی اطلاعات فایل.');
    }
  };

  const handleProcessFile = async (file: File) => {
    if (!file.name.endsWith('.json')) {
      showToast('error', 'لطفاً یک فایل با پسوند .json انتخاب کنید.');
      return;
    }

    setIsActionLoading(true);
    const result = await parseSnapshotFile(file);
    setIsActionLoading(false);

    if (result.success && result.snapshot) {
      onLoadSnapshot(result.snapshot);
      showToast('success', result.message || 'فایل ریفر با موفقیت بارگذاری شد.');
      refreshList();
      onClose();
    } else {
      showToast('error', result.message || 'خطا در بارگذاری فایل ریفر');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                مدیریت و فایل ریفر (Import/Export & Persistent Reference)
              </h2>
              <p className="text-xs text-slate-400">
                نگهداری، انتقال سریع با فایل ریفر JSON و جلوگیری از استخراج تکراری محصولات
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/20 px-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('current')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'current'
                ? 'border-purple-500 text-purple-300 bg-purple-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>کد ریفر فعال و دانلود/آپلود</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('load')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'load'
                ? 'border-purple-500 text-purple-300 bg-purple-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileUp className="w-3.5 h-3.5" />
            <span>فراخوانی کد یا ایمپورت فایل</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'history'
                ? 'border-purple-500 text-purple-300 bg-purple-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>تاریخچه کدهای ذخیره‌شده ({savedSnapshots.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* TAB 1: Current Active Ref Code & Quick Export */}
          {activeTab === 'current' && (
            <div className="space-y-4">
              {/* Highlight Active Box */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-950/60 to-slate-950 border border-purple-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-purple-300 font-medium flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    کد رفرنس فعال سشن:
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {currentProducts.length} محصول در جدول حاضر
                  </span>
                </div>

                <div className="flex items-center justify-between bg-slate-900/90 p-3 rounded-lg border border-purple-500/30">
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-mono font-black text-purple-300 tracking-wider">
                      {activeRefCode || 'هنوز کدی ست نشده'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {activeRefCode && (
                      <button
                        type="button"
                        onClick={() => handleCopy(activeRefCode)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700 active:scale-95"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'کپی شد' : 'کپی کد'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      disabled={currentProducts.length === 0}
                      onClick={handleExportCurrent}
                      className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                      title="دانلود فایل ریفر به صورت JSON"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>دانلود فایل ریفر (JSON)</span>
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  💡 <strong>نحوه کارکرد:</strong> داده‌ها به صورت خودکار با این کد در حافظه محلی و سرور نگهداری می‌شوند. همچنین می‌توانید فایل JSON آن را دانلود کرده و در هر زمان یا سیستم دیگری با ۱ کلیک ایمپورت کنید.
                </p>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Download / Export File Button */}
                <button
                  type="button"
                  disabled={currentProducts.length === 0}
                  onClick={handleExportCurrent}
                  className="p-3 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/40 rounded-xl text-right transition-all flex items-start gap-3 disabled:opacity-50 group"
                >
                  <div className="p-2 rounded-lg bg-purple-500/20 text-purple-300 group-hover:scale-110 transition-transform shrink-0">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-purple-200">اکسپورت / دانلود فایل ریفر</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      دریافت فایل کم‌حجم JSON شامل تمام محصولات و دسته‌بندی‌ها
                    </div>
                  </div>
                </button>

                {/* Quick Import File Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/40 rounded-xl text-right transition-all flex items-start gap-3 group"
                >
                  <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 group-hover:scale-110 transition-transform shrink-0">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-indigo-200">ایمپورت سریع فایل ریفر</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      انتخاب فایل JSON پشتیبان و بارگذاری آنی در جدول
                    </div>
                  </div>
                </button>

                {/* Update / Re-fetch from WooCommerce */}
                <button
                  type="button"
                  disabled={isActionLoading || currentConfig.isDemoMode || !currentConfig.siteUrl}
                  onClick={() => {
                    if (activeRefCode) {
                      onClose();
                      onUpdateFromWooCommerce(activeRefCode);
                    } else {
                      showToast('error', 'ابتدا یک کد رفرنس بسازید.');
                    }
                  }}
                  className="p-3 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 rounded-xl text-right transition-all flex items-start gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform shrink-0">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-emerald-300">بروزرسانی داده‌ها از ووکامرس</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      استخراج مجدد تازه‌ترین محصولات و بازنویسی روی همین کد
                    </div>
                  </div>
                </button>

                {/* Save Current Table into this Code */}
                <button
                  type="button"
                  disabled={isActionLoading || currentProducts.length === 0}
                  onClick={handleSaveToActive}
                  className="p-3 bg-slate-950/60 hover:bg-slate-900 border border-slate-700/80 rounded-xl text-right transition-all flex items-start gap-3 disabled:opacity-50 group"
                >
                  <div className="p-2 rounded-lg bg-slate-800 text-slate-300 group-hover:scale-110 transition-transform shrink-0">
                    <Database className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">ذخیره وضعیت فعلی جدول</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      ثبت تمام محصولات و تغییرات اخیر روی کد ریفر
                    </div>
                  </div>
                </button>
              </div>

              {/* Create Brand New Code */}
              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-200">می‌خواهید یک کد رفرنس جدید بسازید؟</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">یک کد مجزا برای نگهداری نسخه فعلی جدول</div>
                </div>
                <button
                  type="button"
                  disabled={isActionLoading || currentProducts.length === 0}
                  onClick={handleSaveCurrentAsNew}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ایجاد کد رفرنس جدید</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Load Specific Code & Drag-and-drop Import */}
          {activeTab === 'load' && (
            <div className="space-y-4">
              {/* Load by Code */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <label className="text-xs font-bold text-slate-200 block">
                  روش ۱: وارد کردن کد رفرنس (مثلاً REF-48291):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="مثلاً: REF-48291"
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-mono uppercase tracking-wider text-purple-300 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    disabled={isActionLoading || !inputCode.trim()}
                    onClick={() => handleLoadByCode(inputCode)}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isActionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                    <span>فراخوانی آنی</span>
                  </button>
                </div>
              </div>

              {/* Drag and drop JSON File Box */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 rounded-xl border-2 border-dashed text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-purple-400 bg-purple-950/40 scale-[1.01]'
                    : 'border-slate-700 hover:border-purple-500/60 bg-slate-950/50 hover:bg-slate-950'
                }`}
              >
                <FileJson className="w-8 h-8 mx-auto text-purple-400 mb-2" />
                <div className="text-xs font-bold text-slate-200">
                  روش ۲: کشیدن یا کلیک برای انتخاب فایل ریفر JSON
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  فایل پشتیبان <span className="text-purple-300 font-mono">.json</span> را اینجا رها کنید تا بلافاصله دیتای محصولات لود شود.
                </div>
                <button
                  type="button"
                  className="mt-3 px-4 py-1.5 bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>انتخاب فایل JSON</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: History & Saved Snapshots */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {isLoadingList ? (
                <div className="p-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
                  <span>در حال بارگذاری لیست کدهای ذخیره‌شده...</span>
                </div>
              ) : savedSnapshots.length === 0 ? (
                <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-500 text-xs space-y-2">
                  <Bookmark className="w-6 h-6 mx-auto text-slate-600" />
                  <div>هنوز هیچ کد رفرنسی ذخیره نشده است.</div>
                  <div className="text-[10px] text-slate-600">
                    با استخراج محصولات، کد رفرنس به صورت خودکار ایجاد و ذخیره می‌شود.
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {savedSnapshots.map((snap) => {
                    const isActive = snap.refCode === activeRefCode;
                    return (
                      <div
                        key={snap.refCode}
                        onClick={() => handleLoadByCode(snap.refCode)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isActive
                            ? 'bg-purple-950/40 border-purple-500/60 shadow-sm'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                              isActive
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            <Bookmark className="w-4 h-4" />
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sm text-purple-300">
                                {snap.refCode}
                              </span>
                              {isActive && (
                                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded-full font-bold">
                                  فعال
                                </span>
                              )}
                              <span className="text-xs text-slate-300 font-medium">
                                {snap.title || 'مجموعه محصولات'}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                              <span className="flex items-center gap-1">
                                <Layers className="w-3 h-3 text-slate-400" />
                                {snap.productCount} محصول
                              </span>
                              {snap.siteUrl && (
                                <span className="flex items-center gap-1 max-w-[140px] truncate">
                                  <Globe className="w-3 h-3 text-slate-400" />
                                  {snap.siteUrl.replace(/^https?:\/\//, '')}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-slate-400" />
                                {new Date(snap.updatedAt).toLocaleDateString('fa-IR')}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleExportSnapshotItem(snap.refCode, e)}
                            className="p-1.5 text-purple-400 hover:text-purple-200 hover:bg-purple-950/60 rounded-lg transition-colors"
                            title="دانلود فایل JSON ریفر"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(snap.refCode);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                            title="کپی کد رفرنس"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleDelete(snap.refCode, e)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="حذف این کد"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Hidden File Input for JSON import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            سیستم کش محلی و فایل ریفر JSON جهت ماندگاری دائمی بدون معطلی
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            بستن
          </button>
        </div>

      </div>
    </div>
  );
};
