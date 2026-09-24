import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingDown,
  TrendingUp,
  Search,
  Sparkles,
  RefreshCw,
  Layers,
  Flame,
  Globe,
  Sliders,
  CheckCircle2,
  FileSpreadsheet,
  AlertCircle,
  PlusCircle,
  Key,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { WCProduct, WCCategory, WCConnectionConfig } from '../../types';
import {
  PageSeoInsight,
  ContentGapOpportunity,
  CannibalizationIssue,
  GSCConnectionConfig,
} from '../../types/seoTypes';
import {
  generateSeoInsights,
  generateContentGaps,
  generateCannibalizationIssues,
  getStoredSeoConfig,
  saveStoredSeoConfig,
} from '../../services/seoService';
import {
  getStoredGoogleToken,
  fetchGscSearchAnalytics,
  mergeRealGscDataWithProducts,
} from '../../services/googleRealGscService';
import { SeoOverviewStats } from './SeoOverviewStats';
import { RankingsTable } from './RankingsTable';
import { PageInspectorModal } from './PageInspectorModal';
import { ContentGapView } from './ContentGapView';
import { SeoToolsView } from './SeoToolsView';
import { GoogleAuthModal } from './GoogleAuthModal';

interface SeoHubViewProps {
  products: WCProduct[];
  categories: WCCategory[];
  connectionConfig: WCConnectionConfig;
  onUpdateProduct: (productId: number, field: string, value: any) => void;
  onCreateProduct: (productData: any) => Promise<void>;
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const SeoHubView: React.FC<SeoHubViewProps> = ({
  products,
  categories,
  connectionConfig,
  onUpdateProduct,
  onCreateProduct,
  showToast,
}) => {
  const [seoConfig, setSeoConfig] = useState<GSCConnectionConfig>(getStoredSeoConfig());
  const [activeMainTab, setActiveMainTab] = useState<'rankings' | 'gaps' | 'tools'>('rankings');
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'drops' | 'gains' | 'strike_zone' | 'needs_index'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('');

  const [insights, setInsights] = useState<PageSeoInsight[]>([]);
  const [contentGaps, setContentGaps] = useState<ContentGapOpportunity[]>([]);
  const [cannibalizations, setCannibalizations] = useState<CannibalizationIssue[]>([]);

  const [selectedInsight, setSelectedInsight] = useState<PageSeoInsight | null>(null);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  const [isIndexRequesting, setIsIndexRequesting] = useState(false);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isFetchingRealGsc, setIsFetchingRealGsc] = useState(false);
  const [isRealDataLive, setIsRealDataLive] = useState<boolean>(Boolean(getStoredGoogleToken()));

  // Fetch real Google Search Console data via REST API
  const fetchLiveGscData = async (token: string, propUrl: string) => {
    if (!token || !propUrl) return;
    setIsFetchingRealGsc(true);
    try {
      const end = new Date();
      end.setDate(end.getDate() - 2);
      const endDate = end.toISOString().split('T')[0];

      const start = new Date(end);
      start.setDate(start.getDate() - 28);
      const startDate = start.toISOString().split('T')[0];

      const prevEnd = new Date(start);
      prevEnd.setDate(prevEnd.getDate() - 1);
      const prevEndDate = prevEnd.toISOString().split('T')[0];

      const prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - 28);
      const prevStartDate = prevStart.toISOString().split('T')[0];

      const [currentRows, prevRows] = await Promise.all([
        fetchGscSearchAnalytics(token, propUrl, ['page', 'query'], startDate, endDate, 5000),
        fetchGscSearchAnalytics(token, propUrl, ['page', 'query'], prevStartDate, prevEndDate, 5000),
      ]);

      const realInsights = mergeRealGscDataWithProducts(products, currentRows, prevRows, propUrl);
      setInsights(realInsights);
      setIsRealDataLive(true);
      setContentGaps(generateContentGaps(products));
      setCannibalizations(generateCannibalizationIssues(realInsights));
      showToast('success', `داده‌های زنده سرچ کنسول با موفقیت دریافت و با محصولات همگام شدند (${currentRows.length} رکورد جستجو).`);
    } catch (err: any) {
      console.warn('Real GSC fetch error, using calculated baseline:', err);
      showToast('error', `عدم امکان دریافت داده زنده از گوگل: ${err.message}`);
    } finally {
      setIsFetchingRealGsc(false);
    }
  };

  // Initialize and synchronize SEO data when products or siteUrl change
  useEffect(() => {
    const siteUrl = connectionConfig.siteUrl || seoConfig.propertyUrl || 'https://myshop.ir';
    const token = getStoredGoogleToken();

    if (token && seoConfig.propertyUrl) {
      fetchLiveGscData(token, seoConfig.propertyUrl);
    } else {
      const newInsights = generateSeoInsights(products, siteUrl);
      setInsights(newInsights);
      setContentGaps(generateContentGaps(products));
      setCannibalizations(generateCannibalizationIssues(newInsights));
      setIsRealDataLive(false);
    }
  }, [products, connectionConfig.siteUrl, seoConfig.propertyUrl]);

  const categoryNames = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.categories?.[0]?.name || 'عمومی'))).filter(Boolean);
  }, [products]);

  // Filter insights according to active tab
  const displayedInsights = useMemo(() => {
    if (activeFilterTab === 'drops') {
      return insights.filter((i) => i.positionChange <= -1.0);
    }
    if (activeFilterTab === 'gains') {
      return insights.filter((i) => i.positionChange >= 1.0);
    }
    if (activeFilterTab === 'strike_zone') {
      return insights.filter((i) => i.averagePosition >= 7.0 && i.averagePosition <= 20.0);
    }
    if (activeFilterTab === 'needs_index') {
      return insights.filter((i) => i.indexStatus !== 'INDEXED');
    }
    return insights;
  }, [insights, activeFilterTab]);

  // Handler: Request Indexing from Google API
  const handleRequestIndex = async (url: string) => {
    setIsIndexRequesting(true);
    try {
      const res = await fetch('/api/seo/request-indexing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', data.message);
        setInsights((prev) =>
          prev.map((item) =>
            item.pageUrl === url
              ? {
                  ...item,
                  indexStatus: 'INDEXED',
                  lastIndexRequestedDate: 'هم‌اکنون',
                }
              : item
          )
        );
        if (selectedInsight && selectedInsight.pageUrl === url) {
          setSelectedInsight((prev) => (prev ? { ...prev, indexStatus: 'INDEXED' } : null));
        }
      } else {
        showToast('error', data.message || 'خطا در ارسال درخواست ایندکس');
      }
    } catch (e: any) {
      showToast('error', `خطای شبکه: ${e.message}`);
    } finally {
      setIsIndexRequesting(false);
    }
  };

  // Handler: Analyze with Smart SEO Engine
  const handleAnalyzeWithAI = async (insight: PageSeoInsight) => {
    setIsAnalyzingAI(true);
    const prod = products.find((p) => p.id === insight.productId);

    try {
      const res = await fetch('/api/ai/seo-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: prod || { name: insight.productTitle }, insight }),
      });
      const resData = await res.json();

      if (resData.success && resData.data) {
        const aiResult = resData.data;
        const updatedInsight: PageSeoInsight = {
          ...insight,
          aiAnalysis: {
            statusSummary: aiResult.statusSummary,
            healthStatus: insight.aiAnalysis?.healthStatus || 'stable',
            rootCause: aiResult.rootCause,
            contentUpdateReason: aiResult.contentUpdateReason,
            tasks: aiResult.tasks || insight.aiAnalysis?.tasks || [],
            generatedAt: new Date().toISOString(),
          },
        };

        setInsights((prev) =>
          prev.map((item) => (item.productId === insight.productId ? updatedInsight : item))
        );
        setSelectedInsight(updatedInsight);
        showToast('success', 'تحلیل هوش مصنوعی و برنامه زمان‌بندی تسک‌ها با موفقیت بروزرسانی شد.');
      } else {
        showToast('error', 'پاسخ نامعتبر از موتور هوش مصنوعی.');
      }
    } catch (e: any) {
      showToast('error', `خطای ارتباط با هوش مصنوعی: ${e.message}`);
    } finally {
      setIsAnalyzingAI(false);
    }
  };

  // Handler: Apply AI Content Patch to Product
  const handleApplyContentPatch = async (productId: number, patch: any) => {
    try {
      if (patch.seoTitle) {
        onUpdateProduct(productId, 'meta_data.rank_math_title', patch.seoTitle);
      }
      if (patch.focusKeyword) {
        onUpdateProduct(productId, 'meta_data.rank_math_focus_keyword', patch.focusKeyword);
      }
      if (patch.metaDescription) {
        onUpdateProduct(productId, 'meta_data.rank_math_description', patch.metaDescription);
      }
      if (patch.contentAddition) {
        const targetProd = products.find((p) => p.id === productId);
        const currentDesc = targetProd?.description || '';
        const newDesc = `${currentDesc}\n\n${patch.contentAddition}`;
        onUpdateProduct(productId, 'description', newDesc);
      }

      showToast('success', 'تغییرات محتوایی سئو با موفقیت در محصول ووکامرس اعمال شد.');
    } catch (e: any) {
      showToast('error', `خطا در اعمال تغییرات: ${e.message}`);
    }
  };

  // Handler: Create Product from Content Gap
  const handleCreateProductFromGap = async (proposedProduct: any) => {
    setIsCreatingProduct(true);
    try {
      await onCreateProduct(proposedProduct);
      showToast('success', `محصول جدید «${proposedProduct.name}» بر اساس کوئری سرچ کنسول با موفقیت ساخته شد!`);
    } catch (e: any) {
      showToast('error', `خطا در ساخت محصول: ${e.message}`);
    } finally {
      setIsCreatingProduct(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0d0f14] overflow-y-auto p-4 sm:p-6 space-y-6 dir-rtl select-none">
      {/* Top Header & Google Connection Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              مرکز سئو و هوش مصنوعی (Google Search Console & AI Suite)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            پایش لحظه‌ای کلیک‌ها، رتبه کلمات، وضعیت ایندکس، تحلیل افت/رشد هوشمند سئو و ارسال سریع Indexing API
          </p>
        </div>

        {/* Live GSC Connection Button & Main Navigation Tabs */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* GSC Live Connection Pill */}
          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-sm ${
              isRealDataLive
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-950/60'
                : 'bg-indigo-950/40 text-indigo-300 border-indigo-500/40 hover:bg-indigo-900/50'
            }`}
          >
            {isFetchingRealGsc ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            ) : isRealDataLive ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ) : (
              <Globe className="w-4 h-4 text-indigo-400" />
            )}

            <span>
              {isFetchingRealGsc
                ? 'در حال استعلام از گوگل...'
                : isRealDataLive
                ? 'متصل به سرچ کنسول واقعی (Live)'
                : 'اتصال به Google Search Console'}
            </span>

            <span
              className={`w-2 h-2 rounded-full ${
                isRealDataLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
          </button>

          {/* Main Navigation Tabs */}
          <div className="flex items-center gap-1.5 bg-[#181b22] p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveMainTab('rankings')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeMainTab === 'rankings'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>رتبه‌ها و نوسانات</span>
            </button>

            <button
              onClick={() => setActiveMainTab('gaps')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeMainTab === 'gaps'
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>فرصت‌ها ({contentGaps.length})</span>
            </button>

            <button
              onClick={() => setActiveMainTab('tools')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeMainTab === 'tools'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>جعبه ابزار</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stats (Always visible at top for high-level insight) */}
      <SeoOverviewStats
        insights={insights}
        onSelectFilterTab={(tab) => {
          setActiveFilterTab(tab);
          setActiveMainTab('rankings');
        }}
        activeFilter={activeFilterTab}
      />

      {/* Main Tab Content */}
      {activeMainTab === 'rankings' && (
        <RankingsTable
          insights={displayedInsights}
          onSelectInsight={(item) => setSelectedInsight(item)}
          onRequestIndex={handleRequestIndex}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          categories={categoryNames}
        />
      )}

      {activeMainTab === 'gaps' && (
        <ContentGapView
          gaps={contentGaps}
          categories={categories}
          onCreateProductFromGap={handleCreateProductFromGap}
          isCreating={isCreatingProduct}
        />
      )}

      {activeMainTab === 'tools' && (
        <SeoToolsView
          cannibalizations={cannibalizations}
          config={seoConfig}
          onSaveConfig={(cfg) => {
            setSeoConfig(cfg);
            saveStoredSeoConfig(cfg);
            showToast('success', 'تنظیمات سئو با موفقیت ذخیره شد.');
          }}
          onRefreshData={() => {
            const token = getStoredGoogleToken();
            if (token && seoConfig.propertyUrl) {
              fetchLiveGscData(token, seoConfig.propertyUrl);
            } else {
              const siteUrl = connectionConfig.siteUrl || seoConfig.propertyUrl || 'https://myshop.ir';
              const newInsights = generateSeoInsights(products, siteUrl);
              setInsights(newInsights);
              showToast('info', 'داده‌های سئو بروزرسانی شدند.');
            }
          }}
        />
      )}

      {/* Detailed Page Inspector & Action Plan Modal */}
      {selectedInsight && (
        <PageInspectorModal
          insight={selectedInsight}
          product={products.find((p) => p.id === selectedInsight.productId)}
          isOpen={true}
          onClose={() => setSelectedInsight(null)}
          onRequestIndex={handleRequestIndex}
          onApplyContentPatch={handleApplyContentPatch}
          onAnalyzeWithAI={handleAnalyzeWithAI}
          isAnalyzing={isAnalyzingAI}
          isIndexRequesting={isIndexRequesting}
        />
      )}

      {/* Google OAuth / Access Token Modal */}
      <GoogleAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        config={seoConfig}
        onSaveConfig={(cfg) => {
          setSeoConfig(cfg);
          saveStoredSeoConfig(cfg);
        }}
        onConnectRealGsc={fetchLiveGscData}
        showToast={showToast}
      />
    </div>
  );
};
