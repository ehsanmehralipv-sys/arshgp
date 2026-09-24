import { WCConnectionConfig, WCProduct, WCCategory, FetchProgress } from '../types';
import { mockProducts, mockCategories } from '../data/mockProducts';
import * as XLSX from 'xlsx';

const CONFIG_KEY = 'wc_sheet_manager_config';
const LOCAL_PRODUCTS_KEY = 'wc_sheet_manager_products';

export const defaultConfig: WCConnectionConfig = {
  siteUrl: '',
  consumerKey: '',
  consumerSecret: '',
  useProxy: true,
  isDemoMode: true,
};

export function getStoredConfig(): WCConnectionConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) {
      return { ...defaultConfig, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Error reading config from localStorage:', e);
  }
  return defaultConfig;
}

export function saveStoredConfig(config: WCConnectionConfig) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving config to localStorage:', e);
  }
}

// Helper to get local cache if offline/demo
export function getLocalProducts(): WCProduct[] {
  try {
    const raw = localStorage.getItem(LOCAL_PRODUCTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return mockProducts;
}

export function saveLocalProducts(products: WCProduct[]) {
  try {
    localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(products));
  } catch (e) {}
}

export async function testConnection(config: WCConnectionConfig) {
  if (config.isDemoMode) {
    return {
      success: true,
      message: 'حالت آزمایشی (Demo Mode) فعال است. با دیتای نمونه وردپرس کار می‌کنید.',
      totalProducts: mockProducts.length,
      totalPages: 1,
      sampleProduct: mockProducts[0],
    };
  }

  const response = await fetch('/api/wc/test-connection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      siteUrl: config.siteUrl,
      consumerKey: config.consumerKey,
      consumerSecret: config.consumerSecret,
    }),
  });

  return await response.json();
}

export async function fetchPluginSchema(config: WCConnectionConfig) {
  if (config.isDemoMode || !config.siteUrl) {
    return {
      success: true,
      isPluginInstalled: true,
      schema: {
        acf_groups: [
          {
            title: 'اطلاعات اصلی برند و گارانتی',
            key: 'group_brand_warranty',
            fields: [
              { key: 'brand_name', label: 'نام برند', type: 'text' },
              { key: 'warranty_period', label: 'مدت گارانتی', type: 'text' },
              { key: 'country_origin', label: 'کشور سازنده', type: 'text' },
            ],
          },
        ],
        categories: mockCategories,
      },
    };
  }

  try {
    const response = await fetch('/api/wc/sync-schema', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteUrl: config.siteUrl,
        consumerKey: config.consumerKey,
        consumerSecret: config.consumerSecret,
      }),
    });
    return await response.json();
  } catch (err: any) {
    return {
      success: false,
      isPluginInstalled: false,
      message: err.message || 'خطا در ارتباط با افزونه همگام‌ساز',
    };
  }
}

export async function fetchCategories(config: WCConnectionConfig): Promise<WCCategory[]> {
  if (config.isDemoMode || !config.siteUrl) {
    return mockCategories;
  }

  try {
    const response = await fetch('/api/wc/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteUrl: config.siteUrl,
        consumerKey: config.consumerKey,
        consumerSecret: config.consumerSecret,
      }),
    });

    const resData = await response.json();
    if (resData.success && Array.isArray(resData.categories)) {
      return resData.categories;
    }
  } catch (e) {
    console.error('Failed to fetch real categories, falling back to mock:', e);
  }

  return mockCategories;
}

// Helper for client-side resilient page fetch with timeout and retry
async function fetchPageWithRetry(
  config: WCConnectionConfig,
  params: { search?: string; category?: string; perPage: number; page: number },
  signal?: AbortSignal,
  maxRetries = 3
): Promise<{ success: boolean; products: WCProduct[]; totalProducts: number; totalPages: number; message?: string }> {
  let lastErrorMsg = '';

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    if (signal?.aborted) {
      return { success: false, products: [], totalProducts: 0, totalPages: 0, message: 'عملیات توسط کاربر متوقف شد.' };
    }

    const abortCtrl = new AbortController();
    const timeoutId = setTimeout(() => abortCtrl.abort(), 25000); // 25s timeout

    // Listen to parent abort signal
    const onParentAbort = () => abortCtrl.abort();
    if (signal) {
      signal.addEventListener('abort', onParentAbort);
    }

    try {
      const res = await fetch('/api/wc/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: abortCtrl.signal,
        body: JSON.stringify({
          siteUrl: config.siteUrl,
          consumerKey: config.consumerKey,
          consumerSecret: config.consumerSecret,
          search: params.search || '',
          category: params.category || '',
          perPage: params.perPage,
          page: params.page,
          fetchAll: false,
        }),
      });

      clearTimeout(timeoutId);
      if (signal) signal.removeEventListener('abort', onParentAbort);

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        lastErrorMsg = errJson.message || `خطای سرور وردپرس (${res.status})`;
        // Wait before retry
        await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
        continue;
      }

      const data = await res.json();
      if (!data.success) {
        lastErrorMsg = data.message || 'خطا در دریافت اطلاعات';
        await new Promise((r) => setTimeout(r, 1200 * (attempt + 1)));
        continue;
      }

      return {
        success: true,
        products: Array.isArray(data.products) ? data.products : [],
        totalProducts: Number(data.totalProducts) || 0,
        totalPages: Number(data.totalPages) || 1,
      };
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (signal) signal.removeEventListener('abort', onParentAbort);

      if (signal?.aborted) {
        return { success: false, products: [], totalProducts: 0, totalPages: 0, message: 'عملیات توسط کاربر متوقف شد.' };
      }

      lastErrorMsg = err.name === 'AbortError' ? 'تایم‌اوت پاسخ سرور وردپرس' : err.message || 'خطای شبکه';
      if (attempt < maxRetries - 1) {
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      }
    }
  }

  return { success: false, products: [], totalProducts: 0, totalPages: 0, message: lastErrorMsg };
}

export async function fetchProducts(
  config: WCConnectionConfig,
  params?: {
    search?: string;
    category?: string;
    perPage?: number;
    page?: number;
    startPage?: number;
    fetchAll?: boolean;
    signal?: AbortSignal;
    onChunkLoaded?: (newProducts: WCProduct[], accumulatedTotal: number) => void;
    onProgress?: (progress: FetchProgress) => void;
  }
): Promise<{ products: WCProduct[]; totalProducts: number; totalPages: number; completedAll: boolean }> {
  const shouldFetchAll = params?.fetchAll !== false;
  const batchSize = params?.perPage || config.batchSize || 50;

  if (config.isDemoMode || !config.siteUrl) {
    let list = getLocalProducts();
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.id.toString().includes(q) ||
          p.categories.some((c) => c.name.toLowerCase().includes(q))
      );
    }
    if (params?.category) {
      list = list.filter((p) => p.categories.some((c) => c.id.toString() === params.category || c.slug === params.category));
    }

    if (params?.onProgress) {
      params.onProgress({
        loaded: list.length,
        total: list.length,
        currentPage: 1,
        totalPages: 1,
        status: 'completed',
      });
    }

    if (params?.onChunkLoaded) {
      params.onChunkLoaded(list, list.length);
    }

    return {
      products: list,
      totalProducts: list.length,
      totalPages: 1,
      completedAll: true,
    };
  }

  // Progressive resilient streaming extraction
  if (shouldFetchAll) {
    const startPage = params?.startPage || 1;
    let accumulatedProducts: WCProduct[] = [];
    const failedPages: number[] = [];

    // 1. Fetch First/Start Page to know totalProducts & totalPages
    params?.onProgress?.({
      loaded: 0,
      total: 0,
      currentPage: startPage,
      totalPages: 1,
      status: 'fetching',
      currentAction: `در حال دریافت صفحه ${startPage}...`,
    });

    const firstPageResult = await fetchPageWithRetry(
      config,
      {
        search: params?.search,
        category: params?.category,
        perPage: batchSize,
        page: startPage,
      },
      params?.signal
    );

    if (!firstPageResult.success) {
      if (params?.signal?.aborted) {
        params?.onProgress?.({
          loaded: 0,
          total: 0,
          currentPage: startPage,
          totalPages: 1,
          status: 'paused',
          currentAction: 'استخراج توسط کاربر متوقف شد.',
        });
        return { products: [], totalProducts: 0, totalPages: 1, completedAll: false };
      }
      throw new Error(firstPageResult.message || `خطا در دریافت محصولات صفحه ${startPage} از وردپرس`);
    }

    accumulatedProducts = [...firstPageResult.products];
    const totalProducts = firstPageResult.totalProducts || accumulatedProducts.length;
    const calculatedTotalPages = firstPageResult.totalPages || Math.ceil(totalProducts / batchSize) || 1;

    // Immediately stream first chunk to UI
    if (params?.onChunkLoaded && firstPageResult.products.length > 0) {
      params.onChunkLoaded(firstPageResult.products, accumulatedProducts.length);
    }

    params?.onProgress?.({
      loaded: accumulatedProducts.length,
      total: totalProducts,
      currentPage: startPage,
      totalPages: calculatedTotalPages,
      status: startPage >= calculatedTotalPages ? 'completed' : 'fetching',
      currentAction: `صفحه ${startPage} از ${calculatedTotalPages} دریافت شد (${accumulatedProducts.length} از ${totalProducts})`,
    });

    // 2. Loop through all remaining pages with gentle throttling
    if (calculatedTotalPages > startPage) {
      for (let p = startPage + 1; p <= calculatedTotalPages; p++) {
        if (params?.signal?.aborted) {
          params?.onProgress?.({
            loaded: accumulatedProducts.length,
            total: totalProducts,
            currentPage: p - 1,
            totalPages: calculatedTotalPages,
            status: 'paused',
            currentAction: `استخراج متوقف شد. ${accumulatedProducts.length} محصول نگهداری شد.`,
            failedPages,
          });
          return {
            products: accumulatedProducts,
            totalProducts,
            totalPages: calculatedTotalPages,
            completedAll: false,
          };
        }

        params?.onProgress?.({
          loaded: accumulatedProducts.length,
          total: totalProducts,
          currentPage: p,
          totalPages: calculatedTotalPages,
          status: 'fetching',
          currentAction: `در حال دریافت صفحه ${p} از ${calculatedTotalPages}...`,
          failedPages,
        });

        // 150ms gentle pause to keep host responsive
        await new Promise((r) => setTimeout(r, config.requestDelay || 150));

        const pageRes = await fetchPageWithRetry(
          config,
          {
            search: params?.search,
            category: params?.category,
            perPage: batchSize,
            page: p,
          },
          params?.signal
        );

        if (pageRes.success && pageRes.products.length > 0) {
          accumulatedProducts = accumulatedProducts.concat(pageRes.products);

          // Stream chunk to UI immediately
          if (params?.onChunkLoaded) {
            params.onChunkLoaded(pageRes.products, accumulatedProducts.length);
          }

          params?.onProgress?.({
            loaded: accumulatedProducts.length,
            total: Math.max(totalProducts, accumulatedProducts.length),
            currentPage: p,
            totalPages: calculatedTotalPages,
            status: p === calculatedTotalPages ? 'completed' : 'fetching',
            currentAction: `صفحه ${p} از ${calculatedTotalPages} دریافت شد (${accumulatedProducts.length} از ${totalProducts})`,
            failedPages,
          });
        } else if (!pageRes.success) {
          if (params?.signal?.aborted) {
            params?.onProgress?.({
              loaded: accumulatedProducts.length,
              total: totalProducts,
              currentPage: p,
              totalPages: calculatedTotalPages,
              status: 'paused',
              currentAction: `استخراج متوقف شد. ${accumulatedProducts.length} محصول نگهداری شد.`,
              failedPages,
            });
            return {
              products: accumulatedProducts,
              totalProducts,
              totalPages: calculatedTotalPages,
              completedAll: false,
            };
          }

          // Record skipped/failed page without crashing the whole process
          failedPages.push(p);
          console.warn(`WooCommerce page ${p} failed: ${pageRes.message}`);

          params?.onProgress?.({
            loaded: accumulatedProducts.length,
            total: totalProducts,
            currentPage: p,
            totalPages: calculatedTotalPages,
            status: 'fetching',
            currentAction: `صفحه ${p} رد شد (${pageRes.message}). ادامه با صفحات بعدی...`,
            failedPages,
          });
        }
      }
    }

    params?.onProgress?.({
      loaded: accumulatedProducts.length,
      total: Math.max(totalProducts, accumulatedProducts.length),
      currentPage: calculatedTotalPages,
      totalPages: calculatedTotalPages,
      status: 'completed',
      currentAction: `استخراج تمام شد: تعداد ${accumulatedProducts.length} محصول بارگذاری گردید.`,
      failedPages,
    });

    return {
      products: accumulatedProducts,
      totalProducts: Math.max(totalProducts, accumulatedProducts.length),
      totalPages: calculatedTotalPages,
      completedAll: failedPages.length === 0,
    };
  }

  // Single page fetch
  const singleRes = await fetchPageWithRetry(
    config,
    {
      search: params?.search,
      category: params?.category,
      perPage: batchSize,
      page: params?.page || 1,
    },
    params?.signal
  );

  if (!singleRes.success) {
    throw new Error(singleRes.message || 'خطا در دریافت محصولات');
  }

  return {
    products: singleRes.products,
    totalProducts: singleRes.totalProducts,
    totalPages: singleRes.totalPages,
    completedAll: true,
  };
}

export async function updateSingleProduct(
  config: WCConnectionConfig,
  productId: number,
  data: Partial<WCProduct> & { acf?: Record<string, any> }
): Promise<WCProduct> {
  if (config.isDemoMode || !config.siteUrl) {
    const list = getLocalProducts();
    const idx = list.findIndex((p) => p.id === productId);
    if (idx !== -1) {
      const updated = {
        ...list[idx],
        ...data,
        acf: { ...list[idx].acf, ...(data.acf || {}) },
        date_modified: new Date().toISOString(),
      };
      if (data.regular_price !== undefined || data.sale_price !== undefined) {
        const sale = data.sale_price !== undefined ? data.sale_price : list[idx].sale_price;
        const reg = data.regular_price !== undefined ? data.regular_price : list[idx].regular_price;
        updated.price = sale && sale.trim() !== '' ? sale : reg;
      }
      list[idx] = updated;
      saveLocalProducts(list);
      return updated;
    }
    throw new Error('محصول در حالت آزمایشی یافت نشد');
  }

  // Format payload for WooCommerce REST API
  const payload: any = { ...data };

  // Convert categories array if passed
  if (data.categories) {
    payload.categories = data.categories.map((c) => ({ id: c.id, name: c.name }));
  }

  const response = await fetch('/api/wc/product/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      siteUrl: config.siteUrl,
      consumerKey: config.consumerKey,
      consumerSecret: config.consumerSecret,
      productId,
      data: payload,
    }),
  });

  const resData = await response.json();
  if (!resData.success) {
    throw new Error(resData.message || `خطا در بروزرسانی محصول #${productId}`);
  }

  return resData.product;
}

export async function batchSyncProducts(
  config: WCConnectionConfig,
  updatesList: Array<{ id: number; changes: any }>
): Promise<{ success: boolean; updatedCount: number; message: string }> {
  if (config.isDemoMode || !config.siteUrl) {
    const list = getLocalProducts();
    let count = 0;
    updatesList.forEach((item) => {
      const idx = list.findIndex((p) => p.id === item.id);
      if (idx !== -1) {
        list[idx] = {
          ...list[idx],
          ...item.changes,
          acf: { ...list[idx].acf, ...(item.changes.acf || {}) },
          date_modified: new Date().toISOString(),
        };
        count++;
      }
    });
    saveLocalProducts(list);
    return {
      success: true,
      updatedCount: count,
      message: `${count} محصول در حالت آزمایشی با موفقیت بروزرسانی شد.`,
    };
  }

  const formattedUpdates = updatesList.map((item) => ({
    id: item.id,
    ...item.changes,
  }));

  const response = await fetch('/api/wc/product/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      siteUrl: config.siteUrl,
      consumerKey: config.consumerKey,
      consumerSecret: config.consumerSecret,
      updates: formattedUpdates,
    }),
  });

  const resData = await response.json();
  if (!resData.success) {
    throw new Error(resData.message || 'خطا در همگام‌سازی دسته‌جمعی به وردپرس');
  }

  const updatedCount = resData.result?.update?.length || formattedUpdates.length;
  return {
    success: true,
    updatedCount,
    message: `${updatedCount} محصول با موفقیت روی سایت وردپرس آپدیت گردید.`,
  };
}

export async function createNewProduct(
  config: WCConnectionConfig,
  productData: Partial<WCProduct> & { acf?: Record<string, any> }
): Promise<WCProduct> {
  if (config.isDemoMode || !config.siteUrl) {
    const list = getLocalProducts();
    const newId = Math.floor(1000 + Math.random() * 9000);
    const regPrice = productData.regular_price || '0';
    const salePrice = productData.sale_price || '';
    const newProduct: WCProduct = {
      id: newId,
      name: productData.name || 'محصول جدید بدون نام',
      slug: productData.slug || `new-product-${newId}`,
      sku: productData.sku || `SKU-${newId}`,
      regular_price: regPrice,
      sale_price: salePrice,
      price: salePrice && salePrice !== '' ? salePrice : regPrice,
      status: productData.status || 'publish',
      stock_status: productData.stock_status || 'instock',
      stock_quantity: productData.stock_quantity ?? 10,
      categories: productData.categories || mockCategories.slice(0, 1),
      images: productData.images && productData.images.length > 0 ? productData.images : [{ src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80', alt: productData.name }],
      short_description: productData.short_description || '',
      description: productData.description || '',
      acf: productData.acf || { brand_name: 'نام برند', warranty_period: '12 ماه' },
      date_created: new Date().toISOString(),
    };

    list.unshift(newProduct);
    saveLocalProducts(list);
    return newProduct;
  }

  const response = await fetch('/api/wc/product/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      siteUrl: config.siteUrl,
      consumerKey: config.consumerKey,
      consumerSecret: config.consumerSecret,
      productData,
    }),
  });

  const resData = await response.json();
  if (!resData.success) {
    throw new Error(resData.message || 'خطا در ایجاد محصول جدید در ووکامرس');
  }

  return resData.product;
}

// Excel Export/Import Helpers
export function exportProductsToExcel(products: WCProduct[], extraAcfKeys: string[] = []) {
  const excelData = products.map((p) => {
    const categoriesStr = p.categories.map((c) => c.name).join('، ');
    const tagsStr = (p.tags || []).map((t) => t.name).join('، ');
    const imageSrc = p.images?.[0]?.src || '';

    const row: Record<string, any> = {
      'شناسه (ID)': p.id,
      'نام محصول': p.name,
      'شناسه انبار (SKU)': p.sku,
      'قیمت اصلی (ریال/تومان)': p.regular_price,
      'قیمت ویژه (تخفیف)': p.sale_price,
      'وضعیت موجودی': p.stock_status === 'instock' ? 'موجود' : p.stock_status === 'outofstock' ? 'ناموجود' : 'پیش‌خرید',
      'تعداد موجودی': p.stock_quantity ?? 0,
      'دسته بندی': categoriesStr,
      'برچسب‌ها': tagsStr,
      'وضعیت انتشار': p.status === 'publish' ? 'منتشرشده' : p.status === 'draft' ? 'پیش‌نویس' : 'معلق',
      'لینک عکس اصلی': imageSrc,
      'توضیحات کوتاه': p.short_description,
    };

    // Add ACF fields to Excel
    extraAcfKeys.forEach((key) => {
      row[`ACF: ${key}`] = p.acf?.[key] !== undefined ? p.acf[key] : '';
    });

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'محصولات');

  // Generate Excel file and trigger download
  XLSX.writeFile(workbook, `WooCommerce_Products_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
