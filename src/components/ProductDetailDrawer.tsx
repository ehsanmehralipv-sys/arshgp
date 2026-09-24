import React, { useState, useEffect } from 'react';
import { WCProduct, WCCategory } from '../types';
import {
  X,
  Send,
  ExternalLink,
  Image as ImageIcon,
  Layers,
  Plus,
  Trash2,
  Check,
  Globe,
  FileText,
  DollarSign,
  Box,
  Tag,
  Upload,
  Sparkles,
} from 'lucide-react';
import { formatToman } from './ProductSheetGrid';
import { applyArshgpWatermark } from '../utils/watermark';

interface ProductDetailDrawerProps {
  product: WCProduct | null;
  isOpen: boolean;
  onClose: () => void;
  categories: WCCategory[];
  onSaveProduct: (productId: number, updatedData: Partial<WCProduct> & { acf?: Record<string, any> }) => Promise<void>;
  onSyncSingleProduct: (product: WCProduct) => void;
  isLoading: boolean;
}

export const ProductDetailDrawer: React.FC<ProductDetailDrawerProps> = ({
  product,
  isOpen,
  onClose,
  categories,
  onSaveProduct,
  onSyncSingleProduct,
  isLoading,
}) => {
  if (!isOpen || !product) return null;

  const [name, setName] = useState(product.name);
  const [sku, setSku] = useState(product.sku);
  const [regularPrice, setRegularPrice] = useState(product.regular_price);
  const [salePrice, setSalePrice] = useState(product.sale_price);
  const [stockStatus, setStockStatus] = useState(product.stock_status);
  const [stockQuantity, setStockQuantity] = useState(product.stock_quantity ?? 0);
  const [shortDesc, setShortDesc] = useState(product.short_description || '');
  const [fullDesc, setFullDesc] = useState(product.description || '');
  const [status, setStatus] = useState(product.status);
  const [images, setImages] = useState<string[]>(
    product.images && product.images.length > 0 ? product.images.map((i) => i.src) : []
  );
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // ACF key-values state
  const [acfFields, setAcfFields] = useState<Array<{ key: string; value: string }>>(() => {
    if (product.acf) {
      return Object.entries(product.acf).map(([k, v]) => ({
        key: k,
        value: v !== null && v !== undefined ? String(v) : '',
      }));
    }
    return [];
  });
  const [newAcfKey, setNewAcfKey] = useState('');
  const [newAcfVal, setNewAcfVal] = useState('');

  useEffect(() => {
    if (product) {
      setName(product.name);
      setSku(product.sku);
      setRegularPrice(product.regular_price);
      setSalePrice(product.sale_price);
      setStockStatus(product.stock_status);
      setStockQuantity(product.stock_quantity ?? 0);
      setShortDesc(product.short_description || '');
      setFullDesc(product.description || '');
      setStatus(product.status);
      setImages(product.images && product.images.length > 0 ? product.images.map((i) => i.src) : []);
      if (product.acf) {
        setAcfFields(
          Object.entries(product.acf).map(([k, v]) => ({
            key: k,
            value: v !== null && v !== undefined ? String(v) : '',
          }))
        );
      }
    }
  }, [product]);

  const handleAddImage = async () => {
    if (!newImageUrl.trim()) return;
    setIsProcessingImage(true);
    try {
      const watermarked = await applyArshgpWatermark(newImageUrl.trim());
      setImages((prev) => [...prev, watermarked]);
      setNewImageUrl('');
    } catch (err) {
      console.error('Failed to watermark URL image, adding original:', err);
      setImages((prev) => [...prev, newImageUrl.trim()]);
      setNewImageUrl('');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleFileUploadAndWatermark = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setIsProcessingImage(true);
    try {
      const watermarked = await applyArshgpWatermark(file);
      setImages((prev) => [...prev, watermarked]);
    } catch (err) {
      console.error('Error watermarking uploaded file:', err);
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleAddAcfField = () => {
    if (!newAcfKey.trim()) return;
    setAcfFields([...acfFields, { key: newAcfKey.trim(), value: newAcfVal.trim() }]);
    setNewAcfKey('');
    setNewAcfVal('');
  };

  const handleRemoveAcfField = (keyToRemove: string) => {
    setAcfFields(acfFields.filter((f) => f.key !== keyToRemove));
  };

  const handleSaveAll = async () => {
    const acfObj: Record<string, any> = {};
    acfFields.forEach((f) => {
      if (f.key.trim()) acfObj[f.key.trim()] = f.value;
    });

    const updatedData: Partial<WCProduct> & { acf?: Record<string, any> } = {
      name,
      sku,
      regular_price: regularPrice,
      sale_price: salePrice,
      stock_status: stockStatus,
      stock_quantity: Number(stockQuantity),
      short_description: shortDesc,
      description: fullDesc,
      status,
      images: images.map((src) => ({ src })),
      acf: acfObj,
    };

    await onSaveProduct(product.id, updatedData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-y-0 left-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-2xl bg-slate-900 border-r border-slate-800 shadow-2xl flex flex-col justify-between text-slate-200">
          {/* Drawer Header */}
          <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold bg-slate-800 text-slate-300 px-2 py-1 rounded">
                #{product.id}
              </span>
              <h2 className="font-bold text-sm text-slate-100 truncate max-w-md">{product.name}</h2>
            </div>
            <div className="flex items-center gap-2">
              {product.permalink && (
                <a
                  href={product.permalink}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors"
                  title="مشاهده در سایت وردپرس"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Drawer Body Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Product Title & Status */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">نام محصول</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">شناسه انبار (SKU)</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">وضعیت محصول</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="publish">منتشرشده</option>
                    <option value="draft">پیش‌نویس</option>
                    <option value="pending">در انتظار بررسی</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Price & Stock Section */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <span>قیمت‌گذاری و انبارداری</span>
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">قیمت اصلی (تومان)</label>
                  <input
                    type="number"
                    value={regularPrice}
                    onChange={(e) => setRegularPrice(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">{formatToman(regularPrice)} تومان</span>
                </div>
                <div>
                  <label className="block text-[11px] text-emerald-400 mb-1">قیمت فروش ویژه</label>
                  <input
                    type="number"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-emerald-300 focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">{formatToman(salePrice)} تومان</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">وضعیت موجودی</label>
                  <select
                    value={stockStatus}
                    onChange={(e) => setStockStatus(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="instock">موجود در انبار</option>
                    <option value="outofstock">ناموجود</option>
                    <option value="onbackorder">پیش‌خرید</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">تعداد موجودی انبار</label>
                  <input
                    type="number"
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Images Manager */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  تصاویر و گالری محصول ({images.length})
                </span>
              </label>

              <div className="flex flex-wrap gap-2">
                {images.map((src, idx) => (
                  <div key={idx} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 left-1 bg-rose-600/90 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    {idx === 0 && (
                      <span className="absolute bottom-1 right-1 bg-emerald-600 text-[9px] font-bold text-white px-1 py-0.5 rounded">
                        اصلی
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {isProcessingImage && (
                <div className="flex items-center gap-2 p-2 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 text-xs my-2">
                  <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  <span>در حال واتر‌مارک خودکار عکس و قالب‌بندی ۵۱۰×۵۱۰...</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="لینک تصویر جدید را وارد کنید..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none font-mono min-w-[200px]"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  disabled={isProcessingImage}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن با واتر‌مارک</span>
                </button>

                {/* Direct Local Image File Upload with Auto Watermark */}
                <label className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-xs font-medium rounded-xl border border-emerald-500/40 cursor-pointer transition-colors flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>آپلود عکس از سیستم</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUploadAndWatermark(file);
                    }}
                  />
                </label>
              </div>
            </div>

            {/* ACF Custom Fields Editor */}
            <div className="bg-purple-950/20 border border-purple-800/40 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>فیلدهای سفارشی ACF (Advanced Custom Fields)</span>
                </h3>
                <span className="text-[10px] text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  {acfFields.length} کلید فعال
                </span>
              </div>

              <div className="space-y-2">
                {acfFields.map((field, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-950/80 p-2 rounded-xl border border-purple-900/40">
                    <input
                      type="text"
                      value={field.key}
                      onChange={(e) => {
                        const copy = [...acfFields];
                        copy[idx].key = e.target.value;
                        setAcfFields(copy);
                      }}
                      placeholder="کلید ACF (مثلاً brand_name)"
                      className="w-1/3 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-purple-300 font-mono focus:outline-none"
                    />
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => {
                        const copy = [...acfFields];
                        copy[idx].value = e.target.value;
                        setAcfFields(copy);
                      }}
                      placeholder="مقدار"
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveAcfField(field.key)}
                      className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New ACF Field row */}
              <div className="flex items-center gap-2 pt-2 border-t border-purple-900/30">
                <input
                  type="text"
                  value={newAcfKey}
                  onChange={(e) => setNewAcfKey(e.target.value)}
                  placeholder="کلید جدید (e.g. spec_cpu)"
                  className="w-1/3 bg-slate-950 border border-purple-800/60 rounded-lg px-2.5 py-1 text-xs text-purple-200 font-mono focus:outline-none"
                />
                <input
                  type="text"
                  value={newAcfVal}
                  onChange={(e) => setNewAcfVal(e.target.value)}
                  placeholder="مقدار جدید"
                  className="flex-1 bg-slate-950 border border-purple-800/60 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddAcfField}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  ثبت کلید
                </button>
              </div>
            </div>

            {/* Short & Full Description */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">توضیحات کوتاه محصول</label>
                <textarea
                  rows={2}
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">توضیحات کامل (HTML / متن)</label>
                <textarea
                  rows={5}
                  value={fullDesc}
                  onChange={(e) => setFullDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Drawer Footer */}
          <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => onSyncSingleProduct(product)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 rounded-xl transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>همگام‌سازی فوری با وردپرس</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveAll}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-md shadow-emerald-950 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>ذخیره در جدول شیت</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
