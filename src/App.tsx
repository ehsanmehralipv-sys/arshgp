import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  WCProduct,
  WCCategory,
  WCConnectionConfig,
  ColumnDefinition,
  BulkOperationOptions,
  FetchProgress,
  ReferenceSnapshot,
} from './types';
import {
  getStoredConfig,
  saveStoredConfig,
  fetchProducts,
  fetchCategories,
  updateSingleProduct,
  batchSyncProducts,
  createNewProduct,
  exportProductsToExcel,
} from './services/wcApi';
import {
  getActiveReferenceCode,
  setActiveReferenceCode,
  getSnapshot,
  saveSnapshot,
  generateReferenceCode,
  exportSnapshotFile,
  parseSnapshotFile,
} from './services/snapshotService';
import { buildHierarchicalCategories } from './utils/categoryTree';

import { Header } from './components/Header';
import { ExcelToolbar } from './components/ExcelToolbar';
import { ProductSheetGrid } from './components/ProductSheetGrid';
import { NewProductModal } from './components/NewProductModal';
import { ProductDetailDrawer } from './components/ProductDetailDrawer';
import { ConnectionModal } from './components/ConnectionModal';
import { BulkEditModal } from './components/BulkEditModal';
import { AcfFieldManagerModal } from './components/AcfFieldManagerModal';
import { PhpSnippetModal } from './components/PhpSnippetModal';
import { MediaUploadModal } from './components/MediaUploadModal';
import { ReferenceCodeModal } from './components/ReferenceCodeModal';
import { SeoHubView } from './components/seo/SeoHubView';
import { GoogleWorkspaceHub } from './components/workspace/GoogleWorkspaceHub';

import {
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  FileSpreadsheet,
  Download,
  Upload,
  Pause,
  Play,
  RefreshCw,
  Layers,
  StopCircle,
  Bookmark,
} from 'lucide-react';

export default function App() {
  // Navigation View State ('sheet' = Excel spreadsheet, 'seo' = AI SEO Intelligence Hub, 'workspace' = Google Workspace Hub)
  const [currentAppView, setCurrentAppView] = useState<'sheet' | 'seo' | 'workspace'>('sheet');

  // Connection Config State
  const [config, setConfig] = useState<WCConnectionConfig>(() => getStoredConfig());

  // Reference Code & Snapshot State
  const [activeRefCode, setActiveRefCode] = useState<string | null>(() => getActiveReferenceCode());
  const [isReferenceModalOpen, setIsReferenceModalOpen] = useState<boolean>(false);

  // Data States
  const [products, setProducts] = useState<WCProduct[]>([]);
  const [categories, setCategories] = useState<WCCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFilterLoading, setIsFilterLoading] = useState<boolean>(false);
  const [isSyncingSingleId, setIsSyncingSingleId] = useState<number | null>(null);
  const [fetchProgress, setFetchProgress] = useState<FetchProgress | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Unsaved Pending Changes
  const [pendingChanges, setPendingChanges] = useState<Record<number, Partial<WCProduct>>>({});
  const [pendingAcfChanges, setPendingAcfChanges] = useState<Record<number, Record<string, any>>>({});

  // Selection & Filters
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [stockStatusFilter, setStockStatusFilter] = useState<string>('all');
  const [tableDensity, setTableDensity] = useState<'compact' | 'normal' | 'relaxed'>('normal');

  // Modals & Drawers States
  const [isConnectionModalOpen, setIsConnectionModalOpen] = useState<boolean>(false);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState<boolean>(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState<boolean>(false);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<WCProduct | null>(null);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState<boolean>(false);
  const [isAcfManagerModalOpen, setIsAcfManagerModalOpen] = useState<boolean>(false);
  const [isPhpSnippetModalOpen, setIsPhpSnippetModalOpen] = useState<boolean>(false);
  const [isMediaUploadModalOpen, setIsMediaUploadModalOpen] = useState<boolean>(false);

  // Toast Banner State
  const [toast, setToast] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Columns definition
  const [columns, setColumns] = useState<ColumnDefinition[]>([
    { id: 'id', label: 'شناسه', width: 80, visible: true, editable: false },
    { id: 'image', label: 'تصویر', width: 60, visible: true, editable: false },
    { id: 'name', label: 'نام محصول', width: 260, visible: true, editable: true },
    { id: 'sku', label: 'شناسه انبار (SKU)', width: 140, visible: true, editable: true },
    { id: 'regular_price', label: 'قیمت اصلی (تومان)', width: 130, visible: true, editable: true },
    { id: 'sale_price', label: 'قیمت فروش ویژه', width: 130, visible: true, editable: true },
    { id: 'stock_status', label: 'وضعیت موجودی', width: 120, visible: true, editable: true },
    { id: 'stock_quantity', label: 'تعداد انبار', width: 90, visible: true, editable: true },
    { id: 'categories', label: 'دسته‌بندی', width: 150, visible: true, editable: false },
    { id: 'status', label: 'وضعیت انتشار', width: 110, visible: true, editable: true },
    // User Group 1: ACF "عناوین"
    { id: 'acf_sec2title', label: 'عنوان دوم (sec2title)', width: 180, visible: true, isAcf: true, acfKey: 'sec2title', editable: true },
    { id: 'acf_thtitle', label: 'عنوان سوم (thtitle)', width: 160, visible: true, isAcf: true, acfKey: 'thtitle', editable: true },
    { id: 'acf_datasheet', label: 'دیتا شیت (datasheet)', width: 220, visible: true, isAcf: true, acfKey: 'datasheet', editable: true },
    { id: 'acf_عنوان_چهارم', label: 'عنوان چهارم', width: 160, visible: true, isAcf: true, acfKey: 'عنوان_چهارم', editable: true },
    { id: 'acf_ساخت_زیمنس', label: 'ساخت زیمنس', width: 180, visible: true, isAcf: true, acfKey: 'ساخت_زیمنس', editable: true },
    { id: 'acf_ساخت_دلتا', label: 'ساخت دلتا', width: 180, visible: true, isAcf: true, acfKey: 'ساخت_دلتا', editable: true },
    { id: 'acf_article_number', label: 'Article Number', width: 150, visible: true, isAcf: true, acfKey: 'article_number', editable: true },
    { id: 'acf_product_family', label: 'Product family', width: 180, visible: true, isAcf: true, acfKey: 'product_family', editable: true },
    { id: 'acf_product_lifecycle_plm', label: 'Product Lifecycle (PLM)', width: 170, visible: true, isAcf: true, acfKey: 'product_lifecycle_plm', editable: true },
    { id: 'acf_plm_effective_date', label: 'PLM Effective Date', width: 140, visible: false, isAcf: true, acfKey: 'plm_effective_date', editable: true },
    { id: 'acf_net_wighte_kg', label: 'Net Wighte (kg)', width: 120, visible: true, isAcf: true, acfKey: 'net_wighte_kg', editable: true },
    { id: 'acf_packaging_dimension', label: 'Packaging Dimension', width: 160, visible: false, isAcf: true, acfKey: 'packaging_dimension', editable: true },
    { id: 'acf_package_size_unit_of_measure', label: 'Package size unit', width: 130, visible: false, isAcf: true, acfKey: 'package_size_unit_of_measure', editable: true },
    { id: 'acf_quantity_unit', label: 'Quantity Unit', width: 110, visible: false, isAcf: true, acfKey: 'quantity_unit', editable: true },
    { id: 'acf_ean', label: 'EAN', width: 130, visible: true, isAcf: true, acfKey: 'ean', editable: true },
    { id: 'acf_upc', label: 'UPC', width: 120, visible: false, isAcf: true, acfKey: 'upc', editable: true },
    { id: 'acf_country_of_origin', label: 'Country of origin', width: 140, visible: true, isAcf: true, acfKey: 'country_of_origin', editable: true },
    { id: 'acf_datasheet2', label: 'datasheet2', width: 180, visible: false, isAcf: true, acfKey: 'datasheet2', editable: true },
    { id: 'acf_عنوان_دوم_ما', label: 'عنوان دوم ما', width: 160, visible: false, isAcf: true, acfKey: 'عنوان_دوم_ما', editable: true },
    { id: 'acf_لینک_زیمنس', label: 'لینک زیمنس', width: 220, visible: true, isAcf: true, acfKey: 'لینک_زیمنس', editable: true },
    { id: 'acf_دسته_بندی_محصول', label: 'دسته بندی محصول (ACF)', width: 160, visible: false, isAcf: true, acfKey: 'دسته_بندی_محصول', editable: true },
    { id: 'acf_cat_title', label: 'عنوان دلخواه دسته (cat_title)', width: 160, visible: false, isAcf: true, acfKey: 'cat_title', editable: true },
  ]);

  // Initial Load & Load when config changes
  const loadData = async (cfg: WCConnectionConfig, resumeFromPage?: number, targetRefCode?: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortCtrl = new AbortController();
    abortControllerRef.current = abortCtrl;

    setIsLoading(true);

    if (!resumeFromPage || resumeFromPage === 1) {
      if (cfg.isDemoMode || !cfg.siteUrl) {
        setProducts([]);
      }
    }

    try {
      // Categories fetch (if not already fetched or demo mode changed)
      const catsPromise = categories.length === 0 ? fetchCategories(cfg) : Promise.resolve(categories);

      const [cats, prodRes] = await Promise.all([
        catsPromise,
        fetchProducts(cfg, {
          search: searchQuery,
          category: selectedCategory,
          fetchAll: true,
          startPage: resumeFromPage || 1,
          signal: abortCtrl.signal,
          onChunkLoaded: (newChunk) => {
            // Live stream each page directly into the table
            setProducts((prev) => {
              const map = new Map(prev.map((p) => [p.id, p]));
              for (const p of newChunk) {
                map.set(p.id, p);
              }
              return Array.from(map.values());
            });
          },
          onProgress: (p) => setFetchProgress(p),
        }),
      ]);

      setCategories(cats);

      if (prodRes.products.length > 0) {
        // Auto-save snapshot into active reference code or generate a new one
        const refToUse = targetRefCode || activeRefCode || generateReferenceCode();
        setActiveRefCode(refToUse);
        setActiveReferenceCode(refToUse);

        saveSnapshot(refToUse, {
          title: cfg.isDemoMode
            ? `مجموعه آزمایشی (${prodRes.products.length} محصول)`
            : `استخراج ${cfg.siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')} (${prodRes.products.length} محصول)`,
          siteUrl: cfg.siteUrl,
          products: prodRes.products,
          categories: cats,
          config: cfg,
        });

        if (!cfg.isDemoMode) {
          if (prodRes.completedAll) {
            showToast('success', `تمام ${prodRes.products.length} محصول بارگذاری و با کد رفرنس ${refToUse} ذخیره شدند.`);
          } else {
            showToast('info', `تعداد ${prodRes.products.length} محصول با کد رفرنس ${refToUse} نگهداری شدند.`);
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError' && !abortCtrl.signal.aborted) {
        showToast('error', err.message || 'خطا در دریافت اطلاعات از ووکامرس');
      }
    } finally {
      setIsLoading(false);
      if (abortControllerRef.current === abortCtrl) {
        abortControllerRef.current = null;
      }
    }
  };

  const handlePauseFetch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
      setFetchProgress((prev) =>
        prev
          ? {
              ...prev,
              status: 'paused',
              currentAction: `استخراج متوقف شد (${products.length} محصول در جدول نگهداری شد).`,
            }
          : null
      );
      showToast('info', `استخراج متوقف شد. ${products.length} محصول بارگذاری‌شده در جدول نگهداری شدند.`);
    }
  };

  const handleResumeFetch = () => {
    if (!fetchProgress) return;
    const nextPage = (fetchProgress.currentPage || 1) + 1;
    loadData(config, nextPage);
  };

  const handleDismissProgress = () => {
    setFetchProgress(null);
  };

  // Restore snapshot handler
  const handleLoadSnapshot = (snapshot: ReferenceSnapshot) => {
    setProducts(snapshot.products || []);
    setCategories(snapshot.categories || []);
    setActiveRefCode(snapshot.refCode);
    setActiveReferenceCode(snapshot.refCode);

    if (snapshot.pendingChanges) {
      setPendingChanges(snapshot.pendingChanges);
    }
    if (snapshot.config && snapshot.config.siteUrl) {
      setConfig((prev) => ({ ...prev, ...snapshot.config }));
      saveStoredConfig({ ...config, ...snapshot.config });
    }
  };

  // Update / Re-fetch from WooCommerce for active reference code
  const handleUpdateFromWooCommerce = (refCode: string) => {
    showToast('info', `در حال بروزرسانی داده‌های کد رفرنس ${refCode} از ووکامرس...`);
    loadData(config, 1, refCode);
  };

  // Mount initialization: Check active reference code or URL parameter FIRST
  useEffect(() => {
    let isCancelled = false;

    const initializeState = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const urlRef = urlParams.get('ref');
      const targetRef = urlRef || activeRefCode || getActiveReferenceCode();

      if (targetRef) {
        setIsLoading(true);
        try {
          const snapshot = await getSnapshot(targetRef);
          if (!isCancelled && snapshot && Array.isArray(snapshot.products) && snapshot.products.length > 0) {
            handleLoadSnapshot(snapshot);
            setIsLoading(false);
            showToast('info', `داده‌های شما با کد رفرنس ${snapshot.refCode} (${snapshot.productCount} محصول) بدون نیاز به استخراج مجدد بازیابی شدند.`);
            return;
          }
        } catch (e) {
          console.warn('Could not restore snapshot on load:', e);
        }
        setIsLoading(false);
      }

      // If no snapshot exists yet, load data normally
      if (!isCancelled) {
        loadData(config);
      }
    };

    initializeState();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Build full hierarchical categories including subcategories & product counts
  const hierarchicalCategories = useMemo(() => {
    return buildHierarchicalCategories(categories, products);
  }, [categories, products]);

  // Filter & Category Handlers
  const handleSelectCategory = (catId: string) => {
    setSelectedCategory(catId);
    setIsFilterLoading(true);
    setTimeout(() => {
      setIsFilterLoading(false);
    }, 100);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setIsFilterLoading(true);
    setTimeout(() => {
      setIsFilterLoading(false);
    }, 150);
  };

  const handleStockStatusFilterChange = (status: string) => {
    setStockStatusFilter(status);
    setIsFilterLoading(true);
    setTimeout(() => {
      setIsFilterLoading(false);
    }, 100);
  };

  // Filtered Products (Supports Parent Categories and all Child Subcategories)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name?.toLowerCase().includes(q);
        const matchesSku = p.sku?.toLowerCase().includes(q);
        const matchesId = p.id.toString().includes(q);
        const matchesCategory = (p.categories || []).some((c) => c.name?.toLowerCase().includes(q));
        const matchesAcf = p.acf ? Object.values(p.acf).some((val) => String(val).toLowerCase().includes(q)) : false;
        
        if (!matchesName && !matchesSku && !matchesId && !matchesCategory && !matchesAcf) return false;
      }

      // Category filter (support parent + all subcategories)
      if (selectedCategory && selectedCategory !== '') {
        const selectedCatObj = hierarchicalCategories.find(
          (c) => c.id.toString() === selectedCategory || c.slug === selectedCategory || c.name === selectedCategory
        );

        const targetCategoryIds = new Set<number>();
        if (selectedCatObj) {
          targetCategoryIds.add(selectedCatObj.id);
          (selectedCatObj.allDescendantIds || []).forEach((id) => targetCategoryIds.add(id));
        }

        const hasCategory = (p.categories || []).some(
          (c) =>
            (c.id && targetCategoryIds.has(c.id)) ||
            c.id?.toString() === selectedCategory ||
            c.slug === selectedCategory ||
            c.name === selectedCategory
        );
        if (!hasCategory) return false;
      }

      // Stock status filter
      if (stockStatusFilter && stockStatusFilter !== 'all') {
        const currentStockStatus = pendingChanges[p.id]?.stock_status || p.stock_status;
        if (currentStockStatus !== stockStatusFilter) return false;
      }

      return true;
    });
  }, [products, searchQuery, selectedCategory, stockStatusFilter, pendingChanges, hierarchicalCategories]);

  // Cell Edit Handler
  const handleCellEdit = (productId: number, field: string, value: any, isAcf: boolean = false) => {
    if (isAcf) {
      setPendingAcfChanges((prev) => ({
        ...prev,
        [productId]: {
          ...(prev[productId] || {}),
          [field]: value,
        },
      }));
    } else {
      setPendingChanges((prev) => ({
        ...prev,
        [productId]: {
          ...(prev[productId] || {}),
          [field]: value,
        },
      }));
    }
  };

  // Total pending changes count
  const pendingCount = useMemo(() => {
    const keys1 = Object.keys(pendingChanges).map(Number);
    const keys2 = Object.keys(pendingAcfChanges).map(Number);
    const uniqueIds = new Set([...keys1, ...keys2]);
    return uniqueIds.size;
  }, [pendingChanges, pendingAcfChanges]);

  // Single Product Direct Sync
  const handleSingleProductSync = async (product: WCProduct) => {
    setIsSyncingSingleId(product.id);

    const changes = pendingChanges[product.id] || {};
    const acfChanges = pendingAcfChanges[product.id] || {};

    const payload: Partial<WCProduct> & { acf?: Record<string, any> } = {
      ...changes,
      acf: acfChanges,
    };

    try {
      const updated = await updateSingleProduct(config, product.id, payload);

      // Update local state
      setProducts((prev) => prev.map((p) => (p.id === product.id ? { ...p, ...updated } : p)));

      // Remove from pending
      setPendingChanges((prev) => {
        const copy = { ...prev };
        delete copy[product.id];
        return copy;
      });
      setPendingAcfChanges((prev) => {
        const copy = { ...prev };
        delete copy[product.id];
        return copy;
      });

      showToast('success', `محصول #${product.id} با موفقیت در ووکامرس به‌روزرسانی شد.`);
    } catch (err: any) {
      showToast('error', err.message || 'خطا در بروزرسانی محصول');
    } finally {
      setIsSyncingSingleId(null);
    }
  };

  // Batch Sync All Pending Changes
  const handleSyncAll = async () => {
    if (pendingCount === 0) return;

    setIsLoading(true);

    const uniqueIds = Array.from(
      new Set([...Object.keys(pendingChanges).map(Number), ...Object.keys(pendingAcfChanges).map(Number)])
    );

    const updatesList = uniqueIds.map((id) => {
      const changes = pendingChanges[id] || {};
      const acf = pendingAcfChanges[id] || {};
      return {
        id,
        changes: {
          ...changes,
          ...(Object.keys(acf).length > 0 ? { acf } : {}),
        },
      };
    });

    try {
      const res = await batchSyncProducts(config, updatesList);

      if (res.success) {
        // Apply updates to products array locally
        setProducts((prev) =>
          prev.map((p) => {
            const updateItem = updatesList.find((u) => u.id === p.id);
            if (updateItem) {
              return {
                ...p,
                ...updateItem.changes,
                acf: { ...p.acf, ...(updateItem.changes.acf || {}) },
              };
            }
            return p;
          })
        );

        setPendingChanges({});
        setPendingAcfChanges({});
        showToast('success', res.message);
      }
    } catch (err: any) {
      showToast('error', err.message || 'خطا در بروزرسانی دسته‌جمعی به ووکامرس');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset/Discard pending changes
  const handleResetPendingChanges = () => {
    setPendingChanges({});
    setPendingAcfChanges({});
    showToast('info', 'تمام تغییرات ذخیره نشده لغو گردید.');
  };

  // Create Product Handler
  const handleCreateProduct = async (productData: Partial<WCProduct> & { acf?: Record<string, any> }) => {
    setIsLoading(true);
    try {
      const created = await createNewProduct(config, productData);
      setProducts((prev) => [created, ...prev]);
      showToast('success', `محصول جدید "${created.name}" با موفقیت ایجاد و منتشر گردید.`);
    } catch (err: any) {
      showToast('error', err.message || 'خطا در ایجاد محصول جدید');
    } finally {
      setIsLoading(false);
    }
  };

  // Save Product from Detail Drawer
  const handleSaveProductFromDrawer = async (
    productId: number,
    updatedData: Partial<WCProduct> & { acf?: Record<string, any> }
  ) => {
    setIsLoading(true);
    try {
      const updated = await updateSingleProduct(config, productId, updatedData);
      setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, ...updated } : p)));

      // Clear pending for this ID if any
      setPendingChanges((prev) => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });
      setPendingAcfChanges((prev) => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });

      showToast('success', `اطلاعات محصول #${productId} به‌روز شد.`);
    } catch (err: any) {
      showToast('error', err.message || 'خطا در ذخیره اطلاعات');
    } finally {
      setIsLoading(false);
    }
  };

  // Bulk Edit Handler
  const handleApplyBulkEdit = (type: string, value: any) => {
    if (selectedProductIds.length === 0) return;

    selectedProductIds.forEach((id) => {
      const targetProduct = products.find((p) => p.id === id);
      if (!targetProduct) return;

      const currentReg = parseFloat(
        (pendingChanges[id]?.regular_price ?? targetProduct.regular_price ?? '0').toString()
      );

      if (type === 'price_increase_percent') {
        const factor = 1 + value / 100;
        const newReg = Math.round(currentReg * factor);
        handleCellEdit(id, 'regular_price', newReg.toString(), false);
      } else if (type === 'price_decrease_percent') {
        const factor = 1 - value / 100;
        const newReg = Math.round(currentReg * factor);
        handleCellEdit(id, 'regular_price', newReg.toString(), false);
      } else if (type === 'price_fixed_set') {
        handleCellEdit(id, 'regular_price', value.toString(), false);
      } else if (type === 'stock_status') {
        handleCellEdit(id, 'stock_status', value, false);
      } else if (type === 'category_set') {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, categories: [value] } : p))
        );
      }
    });

    showToast('success', `تغییرات روی ${selectedProductIds.length} محصول اعمال گردید (برای ارسال نهایی به سایت دکمه "ارسال به وردپرس" را بزنید).`);
  };

  // Delete Selected Products
  const handleDeleteSelectedProducts = () => {
    if (selectedProductIds.length === 0) return;
    if (window.confirm(`آیا از حذف ${selectedProductIds.length} محصول انتخاب شده از جدول اطمینان دارید؟`)) {
      setProducts((prev) => prev.filter((p) => !selectedProductIds.includes(p.id)));
      setSelectedProductIds([]);
      showToast('info', 'محصولات انتخاب شده از جدول حذف شدند.');
    }
  };

  // Selection Toggles
  const handleToggleSelectAll = () => {
    if (selectedProductIds.length === filteredProducts.length) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map((p) => p.id));
    }
  };

  const handleToggleSelectProduct = (id: number) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter((item) => item !== id));
    } else {
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  // Add ACF Column
  const handleAddAcfColumn = (acfKey: string, label: string) => {
    const colId = `acf_${acfKey}`;
    if (columns.some((c) => c.id === colId)) {
      showToast('info', 'این ستون قبلاً اضافه شده است.');
      return;
    }

    setColumns([
      ...columns,
      {
        id: colId,
        label,
        width: 140,
        visible: true,
        isAcf: true,
        acfKey,
        editable: true,
      },
    ]);
    showToast('success', `ستون ACF "${label}" با کلید ${acfKey} اضافه شد.`);
  };

  const handleRemoveColumn = (columnId: string) => {
    setColumns(columns.filter((c) => c.id !== columnId));
  };

  // Media & ACF Update handler from Studio Modal
  const handleUpdateProductAcfAndImage = (
    productId: number,
    acfUpdates: Record<string, any>,
    newImageUrl?: string
  ) => {
    // Update local products state immediately
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        if (p.id === productId) {
          const updatedAcf = { ...(p.acf || {}), ...acfUpdates };
          const updatedImages = newImageUrl
            ? [{ id: Date.now(), src: newImageUrl, name: 'Main Image', alt: p.name }, ...(p.images || [])]
            : p.images;
          return {
            ...p,
            acf: updatedAcf,
            images: updatedImages,
          };
        }
        return p;
      })
    );

    // Record pending changes
    setPendingAcfChanges((prev) => {
      const existing = prev[productId] || {};
      return {
        ...prev,
        [productId]: { ...existing, ...acfUpdates },
      };
    });

    if (newImageUrl) {
      setPendingChanges((prev) => {
        const existing = prev[productId] || {};
        return {
          ...prev,
          [productId]: {
            ...existing,
            images: [{ src: newImageUrl }],
          },
        };
      });
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    const extraAcfKeys = columns.filter((c) => c.isAcf && c.acfKey).map((c) => c.acfKey as string);
    exportProductsToExcel(filteredProducts, extraAcfKeys);
    showToast('success', 'فایل اکسل محصولات با موفقیت دانلود شد.');
  };

  // Quick Reference Snapshot Export (Download JSON)
  const handleQuickExportReference = () => {
    const code = activeRefCode || generateReferenceCode();
    const snapshot: ReferenceSnapshot = {
      refCode: code,
      title: `محصولات ${config.siteUrl || 'فروشگاه'} (${products.length} محصول)`,
      siteUrl: config.siteUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      productCount: products.length,
      products: products,
      categories: categories,
      config: config,
      pendingChanges: pendingChanges,
    };
    exportSnapshotFile(snapshot);
    showToast('success', `فایل ریفر با کد ${code} (${products.length} محصول) دانلود شد.`);
  };

  // Quick Reference Snapshot Import (Upload JSON)
  const handleQuickImportReference = async (file: File) => {
    setIsLoading(true);
    const result = await parseSnapshotFile(file);
    setIsLoading(false);
    if (result.success && result.snapshot) {
      handleLoadSnapshot(result.snapshot);
      showToast('success', result.message || 'فایل ریفر با موفقیت بازیابی شد.');
    } else {
      showToast('error', result.message || 'خطا در بارگذاری فایل ریفر');
    }
  };

  // Full Reset to Demo Mode & Clean State
  const handleResetToDemo = () => {
    if (
      !window.confirm(
        'آیا از ریست کامل پنل و بازگشت به حالت تستی (Demo) اطمینان دارید؟\nتمام داده‌های جدول پاک شده و پنجره تنظیمات جهت اتصال جدید یا ایمپورت فایل باز خواهد شد.'
      )
    ) {
      return;
    }

    // 1. Abort any active fetching requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // 2. Clear Active Reference Code
    setActiveRefCode(null);
    setActiveReferenceCode(null);

    // 3. Clear URL search query param if present
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('ref');
      window.history.replaceState({}, '', url.pathname);
    } catch (e) {}

    // 4. Reset connection config to demo
    const resetConfig: WCConnectionConfig = {
      siteUrl: '',
      consumerKey: '',
      consumerSecret: '',
      isDemoMode: true,
      useProxy: true,
    };
    setConfig(resetConfig);
    saveStoredConfig(resetConfig);

    // 5. Reset UI & table states
    setPendingChanges({});
    setSelectedProductIds([]);
    setSearchQuery('');
    setSelectedCategory('');
    setStockStatusFilter('all');
    setFetchProgress(null);
    setIsLoading(false);
    setIsFilterLoading(false);

    // 6. Reload initial demo / mock data
    loadData(resetConfig);

    // 7. Open connection settings modal so user can immediately reconfigure or import
    setIsConnectionModalOpen(true);

    showToast('info', 'برنامه به حالت آزمایشی (Demo) ریست شد. پنجره تنظیمات جهت اتصال یا ایمپورت جدید باز شد.');
  };

  return (
    <div className="h-screen w-screen bg-[#0f1115] text-slate-100 font-sans flex flex-col dir-rtl select-none overflow-hidden">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-10 right-5 z-50 max-w-md animate-slide-up">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl border flex items-center justify-between gap-3 text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500 text-emerald-200'
                : toast.type === 'error'
                ? 'bg-rose-950/90 border-rose-500 text-rose-200'
                : 'bg-[#16191f] border-purple-500 text-purple-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : toast.type === 'error' ? (
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              ) : (
                <Info className="w-4 h-4 text-purple-400" />
              )}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Top Header */}
      <Header
        config={config}
        pendingCount={pendingCount}
        totalProducts={products.length}
        isLoading={isLoading}
        activeRefCode={activeRefCode}
        currentAppView={currentAppView}
        onSwitchView={setCurrentAppView}
        onOpenConnectionModal={() => setIsConnectionModalOpen(true)}
        onOpenNewProductModal={() => setIsNewProductModalOpen(true)}
        onOpenPhpSnippetModal={() => setIsPhpSnippetModalOpen(true)}
        onOpenAcfManagerModal={() => setIsAcfManagerModalOpen(true)}
        onOpenReferenceModal={() => setIsReferenceModalOpen(true)}
        onQuickExportReference={handleQuickExportReference}
        onQuickImportReference={handleQuickImportReference}
        onResetToDemo={handleResetToDemo}
        onSyncAll={handleSyncAll}
        onRefreshData={() => setIsReferenceModalOpen(true)}
        onExportExcel={handleExportExcel}
        onImportExcelTrigger={() => {}}
      />

      {/* When currentAppView is 'sheet', render Spreadsheet Controls & Grid */}
      {currentAppView === 'sheet' && (
        <>
          {/* Spreadsheet Control Toolbar */}
          <ExcelToolbar
            categories={hierarchicalCategories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleSelectCategory}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            stockStatusFilter={stockStatusFilter}
            onStockStatusFilterChange={handleStockStatusFilterChange}
            selectedProductIds={selectedProductIds}
            totalProductsCount={products.length}
            filteredProductsCount={filteredProducts.length}
            tableDensity={tableDensity}
            onChangeDensity={setTableDensity}
            onOpenBulkEditModal={() => setIsBulkEditModalOpen(true)}
            onOpenAcfManagerModal={() => setIsAcfManagerModalOpen(true)}
            onOpenMediaUploadModal={() => setIsMediaUploadModalOpen(true)}
            onToggleColumnVisibility={() => setIsAcfManagerModalOpen(true)}
            onDeleteSelectedProducts={handleDeleteSelectedProducts}
            onResetPendingChanges={handleResetPendingChanges}
            onOpenReferenceModal={() => setIsReferenceModalOpen(true)}
            pendingChangesCount={pendingCount}
          />

          {/* Progressive Multi-page Extraction Banner with Pause/Resume Controls */}
          {fetchProgress && (
            <div className="bg-slate-900 border-b border-slate-700/80 px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-200 animate-fade-in shrink-0 shadow-md">
              <div className="flex items-center gap-3">
                {fetchProgress.status === 'fetching' ? (
                  <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin shrink-0" />
                ) : fetchProgress.status === 'paused' ? (
                  <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Pause className="w-2.5 h-2.5" />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3 h-3" />
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-100">
                      {fetchProgress.status === 'fetching'
                        ? 'در حال استخراج پیوسته و هوشمند محصولات:'
                        : fetchProgress.status === 'paused'
                        ? 'استخراج متوقف شد:'
                        : 'استخراج کامل شد:'}
                    </span>
                    <span className="text-emerald-300 font-mono text-[11px]">
                      صفحه {fetchProgress.currentPage} از {fetchProgress.totalPages}
                    </span>
                    <span className="text-slate-400">
                      ({fetchProgress.loaded} از {fetchProgress.total} محصول دریافت و آماده شد)
                    </span>
                  </div>

                  {fetchProgress.currentAction && (
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {fetchProgress.currentAction}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Progress Bar */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-emerald-300 font-bold min-w-9 text-left">
                    {Math.min(100, Math.round((fetchProgress.loaded / (fetchProgress.total || 1)) * 100))}%
                  </span>
                  <div className="w-36 sm:w-44 bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        fetchProgress.status === 'paused'
                          ? 'bg-amber-500'
                          : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      }`}
                      style={{
                        width: `${Math.min(100, Math.round((fetchProgress.loaded / (fetchProgress.total || 1)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                {fetchProgress.status === 'fetching' ? (
                  <button
                    type="button"
                    onClick={handlePauseFetch}
                    className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                    title="توقف موقت استخراج و نگهداری محصولات بارگذاری شده تا این لحظه"
                  >
                    <Pause className="w-3 h-3" />
                    <span>توقف و نگهداری</span>
                  </button>
                ) : fetchProgress.currentPage < fetchProgress.totalPages ? (
                  <button
                    type="button"
                    onClick={handleResumeFetch}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>ادامه از صفحه {fetchProgress.currentPage + 1}</span>
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={handleDismissProgress}
                  className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                  title="بستن اعلان"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Main Grid View */}
          <main className="flex-1 w-full overflow-hidden relative bg-[#0f1115]">
            <ProductSheetGrid
              products={filteredProducts}
              categories={categories}
              columns={columns}
              pendingChanges={pendingChanges}
              pendingAcfChanges={pendingAcfChanges}
              selectedProductIds={selectedProductIds}
              onToggleSelectAll={handleToggleSelectAll}
              onToggleSelectProduct={handleToggleSelectProduct}
              onCellEdit={handleCellEdit}
              onSingleProductSync={handleSingleProductSync}
              onOpenDetailDrawer={(product) => {
                setSelectedProductForDetail(product);
                setIsDetailDrawerOpen(true);
              }}
              tableDensity={tableDensity}
              isSyncingProductId={isSyncingSingleId}
              isLoading={isLoading || isFilterLoading}
            />
          </main>
        </>
      )}

      {/* When currentAppView is 'seo', render the SEO & AI Intelligence Suite */}
      {currentAppView === 'seo' && (
        <SeoHubView
          products={products}
          categories={categories}
          connectionConfig={config}
          onUpdateProduct={(productId, field, value) => {
            if (field.startsWith('meta_data.')) {
              const metaKey = field.replace('meta_data.', '');
              handleCellEdit(productId, metaKey, value, true);
            } else {
              handleCellEdit(productId, field, value, false);
            }
          }}
          onCreateProduct={handleCreateProduct}
          showToast={showToast}
        />
      )}

      {/* When currentAppView is 'workspace', render Google Workspace Hub (Drive, Calendar, Gmail) */}
      {currentAppView === 'workspace' && (
        <GoogleWorkspaceHub
          products={products}
          showToast={showToast}
        />
      )}

      {/* Bottom Spreadsheet Status Bar */}
      <footer className="h-7 bg-[#16191f] border-t border-[#2d323b] px-4 text-[11px] text-slate-400 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>آماده همگام‌سازی (REST API v3)</span>
          </span>
          <span className="text-[#8b949e] border-r border-[#2d323b] pr-4">
            حالت: <strong className="text-slate-200 font-bold">{config.isDemoMode ? 'دیتای آزمایشی (Demo)' : 'اتصال مستقیم WooCommerce'}</strong>
          </span>
        </div>

        <div className="flex items-center gap-4 text-[#8b949e]">
          {activeRefCode && (
            <button
              type="button"
              onClick={() => setIsReferenceModalOpen(true)}
              className="flex items-center gap-1.5 text-purple-300 hover:text-purple-200 bg-purple-950/40 border border-purple-500/30 px-2 py-0.5 rounded transition-colors"
              title="مشاهده و مدیریت کد رفرنس فعال"
            >
              <Bookmark className="w-3 h-3 text-purple-400" />
              <span>کد رفرنس: <strong>{activeRefCode}</strong></span>
            </button>
          )}
          <span>
            تعداد کل محصولات: <strong className="text-slate-200">{products.length}</strong>
          </span>
          {pendingCount > 0 && (
            <span className="text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded font-bold">
              {pendingCount} تغییر ذخیره نشده
            </span>
          )}
        </div>
      </footer>

      {/* Modals & Slide Drawers */}
      <ConnectionModal
        isOpen={isConnectionModalOpen}
        onClose={() => setIsConnectionModalOpen(false)}
        config={config}
        onSaveConfig={(newCfg) => {
          setConfig(newCfg);
          saveStoredConfig(newCfg);
          loadData(newCfg);
          showToast('success', 'تنظیمات اتصال با موفقیت بروزرسانی گردید.');
        }}
        onOpenPhpSnippetModal={() => {
          setIsConnectionModalOpen(false);
          setIsPhpSnippetModalOpen(true);
        }}
      />

      <NewProductModal
        isOpen={isNewProductModalOpen}
        onClose={() => setIsNewProductModalOpen(false)}
        categories={categories}
        onCreateProduct={handleCreateProduct}
        isLoading={isLoading}
      />

      <ProductDetailDrawer
        product={selectedProductForDetail}
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        categories={categories}
        onSaveProduct={handleSaveProductFromDrawer}
        onSyncSingleProduct={(prod) => {
          handleSingleProductSync(prod);
          setIsDetailDrawerOpen(false);
        }}
        isLoading={isLoading}
      />

      <BulkEditModal
        isOpen={isBulkEditModalOpen}
        onClose={() => setIsBulkEditModalOpen(false)}
        selectedCount={selectedProductIds.length}
        categories={categories}
        onApplyBulkEdit={handleApplyBulkEdit}
      />

      <AcfFieldManagerModal
        isOpen={isAcfManagerModalOpen}
        onClose={() => setIsAcfManagerModalOpen(false)}
        columns={columns}
        onAddAcfColumn={handleAddAcfColumn}
        onRemoveColumn={handleRemoveColumn}
      />

      <PhpSnippetModal
        isOpen={isPhpSnippetModalOpen}
        onClose={() => setIsPhpSnippetModalOpen(false)}
      />

      <MediaUploadModal
        isOpen={isMediaUploadModalOpen}
        onClose={() => setIsMediaUploadModalOpen(false)}
        products={products}
        selectedProductIds={selectedProductIds}
        config={config}
        onUpdateProductAcfAndImage={handleUpdateProductAcfAndImage}
        onShowToast={showToast}
      />

      <ReferenceCodeModal
        isOpen={isReferenceModalOpen}
        onClose={() => setIsReferenceModalOpen(false)}
        activeRefCode={activeRefCode}
        currentProducts={products}
        currentCategories={categories}
        currentConfig={config}
        currentPendingChanges={pendingChanges}
        onLoadSnapshot={handleLoadSnapshot}
        onUpdateFromWooCommerce={handleUpdateFromWooCommerce}
        showToast={showToast}
      />
    </div>
  );
}
