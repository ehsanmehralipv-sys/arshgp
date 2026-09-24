import React, { useState, useEffect } from 'react';
import {
  X,
  Globe,
  CheckCircle2,
  AlertCircle,
  Key,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  Layers,
  Sparkles,
  Search,
  Lock,
  Zap,
} from 'lucide-react';
import {
  getStoredGoogleToken,
  saveGoogleToken,
  clearGoogleToken,
  fetchUserGscSites,
  GscSiteEntry,
} from '../../services/googleRealGscService';
import { GSCConnectionConfig } from '../../types/seoTypes';

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GSCConnectionConfig;
  onSaveConfig: (config: GSCConnectionConfig) => void;
  onConnectRealGsc: (token: string, propertyUrl: string) => Promise<void>;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onConnectRealGsc,
  showToast,
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [activeToken, setActiveToken] = useState<string | null>(getStoredGoogleToken());
  const [isVerifying, setIsVerifying] = useState(false);
  const [userSites, setUserSites] = useState<GscSiteEntry[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>(config.propertyUrl || '');
  const [authMethod, setAuthMethod] = useState<'oauth' | 'manual_token'>('oauth');

  useEffect(() => {
    if (isOpen) {
      const token = getStoredGoogleToken();
      setActiveToken(token);
      if (token) {
        loadSites(token);
      }
    }
  }, [isOpen]);

  const loadSites = async (token: string) => {
    setIsVerifying(true);
    try {
      const sites = await fetchUserGscSites(token);
      setUserSites(sites);
      if (sites.length > 0 && (!selectedProperty || !sites.some((s) => s.siteUrl === selectedProperty))) {
        setSelectedProperty(sites[0].siteUrl);
      }
    } catch (err: any) {
      console.warn('Could not auto-fetch GSC sites:', err);
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  const handleVerifyAndConnect = async (tokenToUse: string) => {
    if (!tokenToUse.trim()) {
      showToast('error', 'لطفاً توکن دسترسی گوگل (Access Token) را وارد کنید.');
      return;
    }

    setIsVerifying(true);
    try {
      const sites = await fetchUserGscSites(tokenToUse.trim());
      setUserSites(sites);
      saveGoogleToken(tokenToUse.trim(), 3600);
      setActiveToken(tokenToUse.trim());

      const propertyToUse = selectedProperty || (sites.length > 0 ? sites[0].siteUrl : config.propertyUrl);
      setSelectedProperty(propertyToUse);

      onSaveConfig({
        ...config,
        isConnected: true,
        authMethod: 'oauth',
        propertyUrl: propertyToUse,
        lastSyncedAt: new Date().toISOString(),
      });

      await onConnectRealGsc(tokenToUse.trim(), propertyToUse);
      showToast('success', `اتصال زنده به Google Search Console برقرار شد (${sites.length} دامنه شناسایی گردید).`);
      onClose();
    } catch (err: any) {
      showToast('error', `عدم امکان برقراری ارتباط با گوگل: ${err.message || 'توکن نامعتبر یا منقضی شده است.'}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDisconnect = () => {
    clearGoogleToken();
    setActiveToken(null);
    setUserSites([]);
    onSaveConfig({
      ...config,
      isConnected: false,
      authMethod: 'demo',
    });
    showToast('info', 'اتصال حساب گوگل قطع شد و به حالت آزمایشی بازگشت.');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#161922] border border-slate-700/80 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#12141a]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                اتصال مستقیم به Google Search Console و Google Indexing
              </h2>
              <p className="text-[11px] text-slate-400">
                دریافت آمار دقیق کلیک‌ها، ایمپرشن‌ها و رتبه واقعی کلمات کلیدی از سرچ کنسول شما
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto text-xs text-slate-300">
          {/* Status banner */}
          {activeToken ? (
            <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-emerald-300">حساب گوگل متصل است (وضعیت زنده)</div>
                  <div className="text-[11px] text-slate-300">داده‌های سرچ کنسول به صورت مستقیم همگام‌سازی می‌شوند.</div>
                </div>
              </div>
              <button
                onClick={handleDisconnect}
                className="px-3 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
              >
                قطع اتصال
              </button>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/40 flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-amber-300">در حال حاضر داده‌ها بر اساس الگوهای محاسباتی شبیه‌سازی شده‌اند</div>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                  برای مشاهده رتبه و ورودی‌های ۱۰۰٪ واقعی سرچ کنسول فروشگاه خود، احراز هویت گوگل را در زیر تایید و متصل کنید.
                </p>
              </div>
            </div>
          )}

          {/* Property Selector if sites are loaded */}
          {userSites.length > 0 && (
            <div className="space-y-2 bg-[#12141a] p-3.5 rounded-xl border border-slate-800">
              <label className="font-bold text-slate-200 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                انتخاب دامنه و Property از اکانت سرچ کنسول شما:
              </label>
              <select
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none focus:border-indigo-500 cursor-pointer"
              >
                {userSites.map((site) => (
                  <option key={site.siteUrl} value={site.siteUrl}>
                    {site.siteUrl} ({site.permissionLevel === 'siteOwner' ? 'مالک دامنه' : site.permissionLevel})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Connect using Bearer Token or GSI */}
          <div className="space-y-3 bg-[#12141a] p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-amber-400" />
                ورود توکن احراز هویت گوگل (OAuth Access Token)
              </span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                Google Search Console API v3
              </span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              اگر قبلاً مجوز OAuth را تایید کرده‌اید یا از کنسول توسعه‌دهندگان گوگل توکن دارید، آن را در کادر زیر قرار دهید:
            </p>

            <div className="space-y-2">
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="ya29.a0AfH6SM... (Google OAuth Access Token)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-mono text-xs outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                امنیت: کلیه درخواست‌ها از طریق HTTPS مستقیم به سرورهای گوگل ارسال می‌گردند.
              </span>
              <button
                type="button"
                disabled={isVerifying || !tokenInput.trim()}
                onClick={() => handleVerifyAndConnect(tokenInput)}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white rounded-xl font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>در حال استعلام از گوگل...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>تایید و استخراج داده‌های زنده</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#12141a] flex items-center justify-between text-[11px]">
          <span className="text-slate-400">پشتیبانی از پروتکل‌های رسمی Google Search Console REST API v3</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            بستن پنجره
          </button>
        </div>
      </div>
    </div>
  );
};
