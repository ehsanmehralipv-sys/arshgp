import React, { useState } from 'react';
import { WCCategory, WCProduct } from '../types';
import { X, Plus, Package, Tag, Image as ImageIcon, DollarSign, Layers, FileText, Check, Upload, Sparkles } from 'lucide-react';
import { applyArshgpWatermark } from '../utils/watermark';

interface NewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: WCCategory[];
  onCreateProduct: (productData: Partial<WCProduct> & { acf?: Record<string, any> }) => Promise<void>;
  isLoading: boolean;
}

export const NewProductModal: React.FC<NewProductModalProps> = ({
  isOpen,
  onClose,
  categories,
  onCreateProduct,
  isLoading,
}) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [regularPrice, setRegularPrice] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState<number>(10);
  const [selectedCatIds, setSelectedCatIds] = useState<number[]>(categories[0] ? [categories[0].id] : []);
  const [imageUrl, setImageUrl] = useState('');
  const [isWatermarking, setIsWatermarking] = useState(false);
  const [watermarkedBadge, setWatermarkedBadge] = useState(false);
  const [shortDesc, setShortDesc] = useState('');
  const [fullDesc, setFullDesc] = useState('');
  const [status, setStatus] = useState<'publish' | 'draft'>('publish');
  const [brandName, setBrandName] = useState('');
  const [warrantyPeriod, setWarrantyPeriod] = useState('');

  if (!isOpen) return null;

  const handleImageFileChange = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setIsWatermarking(true);
    try {
      const watermarkedDataUrl = await applyArshgpWatermark(file);
      setImageUrl(watermarkedDataUrl);
      setWatermarkedBadge(true);
    } catch (err) {
      console.error('Error applying watermark:', err);
    } finally {
      setIsWatermarking(false);
    }
  };

  const handleApplyWatermarkToUrl = async () => {
    if (!imageUrl) return;
    setIsWatermarking(true);
    try {
      const watermarkedDataUrl = await applyArshgpWatermark(imageUrl);
      setImageUrl(watermarkedDataUrl);
      setWatermarkedBadge(true);
    } catch (err) {
      console.error('Error watermarking image URL:', err);
    } finally {
      setIsWatermarking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const matchedCats = categories.filter((c) => selectedCatIds.includes(c.id));
    const images = imageUrl.trim() ? [{ src: imageUrl.trim(), alt: name }] : [];

    await onCreateProduct({
      name: name.trim(),
      sku: sku.trim() || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      regular_price: regularPrice,
      sale_price: salePrice,
      stock_quantity: Number(stockQuantity),
      stock_status: Number(stockQuantity) > 0 ? 'instock' : 'outofstock',
      categories: matchedCats,
      images,
      short_description: shortDesc,
      description: fullDesc,
      status,
      acf: {
        brand_name: brandName,
        warranty_period: warrantyPeriod,
      },
    });

    // reset fields
    setName('');
    setSku('');
    setRegularPrice('');
    setSalePrice('');
    onClose();
  };

  const toggleCategory = (catId: number) => {
    if (selectedCatIds.includes(catId)) {
      setSelectedCatIds(selectedCatIds.filter((id) => id !== catId));
    } else {
      setSelectedCatIds([...selectedCatIds, catId]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-100">افزودن محصول جدید به ووکامرس</h2>
              <p className="text-xs text-slate-400">اطلاعات کامل محصول را وارد کنید تا مستقیماً ایجاد و ارسال شود.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              نام محصول <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثلاً: گوشی موبایل سامسونگ S24 Ultra"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* SKU & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">شناسه انبار (SKU)</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="SAM-S24U-256"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">وضعیت انتشار</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="publish">منتشرشده آنلاین</option>
                <option value="draft">پیش‌نویس</option>
              </select>
            </div>
          </div>

          {/* Prices & Stock */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">قیمت اصلی (تومان)</label>
              <input
                type="number"
                value={regularPrice}
                onChange={(e) => setRegularPrice(e.target.value)}
                placeholder="68500000"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-emerald-400 mb-1">قیمت فروش ویژه (تخفیف)</label>
              <input
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="65900000"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-emerald-300 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">موجودی انبار (تعداد)</label>
              <input
                type="number"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">انتخاب دسته‌بندی‌ها</label>
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-2 bg-slate-950 border border-slate-800 rounded-xl">
              {categories.map((cat) => {
                const isSelected = selectedCatIds.includes(cat.id);
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-medium'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-emerald-400" />}
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Image Upload & Watermark Section */}
          <div className="space-y-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-400" />
                <span>تصویر محصول (واتر‌مارک خودکار ۵۱۰×۵۱۰ عرش کنترل برنا)</span>
              </label>
              {watermarkedBadge && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>واتر‌مارک رسمی اعمال شد</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Direct File Upload with Auto-Watermark */}
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-emerald-500/70 bg-slate-900/80 hover:bg-slate-900 rounded-xl p-3 text-center cursor-pointer transition-all group">
                <Upload className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 group-hover:scale-110 transition-all mb-1" />
                <span className="text-xs font-bold text-slate-200">آپلود عکس از کامپیوتر</span>
                <span className="text-[10px] text-slate-400">واتر‌مارک و ۵۱۰×۵۱۰ خودکار</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImageFileChange(e.target.files[0])}
                />
              </label>

              {/* URL Input */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400">یا درج آدرس لینک تصویر (URL):</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => {
                      setImageUrl(e.target.value);
                      setWatermarkedBadge(false);
                    }}
                    placeholder="https://..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                  {imageUrl && !watermarkedBadge && (
                    <button
                      type="button"
                      onClick={handleApplyWatermarkToUrl}
                      disabled={isWatermarking}
                      className="px-2 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold shrink-0 transition-all"
                      title="اعمال واتر‌مارک ۵۱۰×۵۱۰ روی آدرس"
                    >
                      واتر‌مارک
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Preview Box */}
            {isWatermarking ? (
              <div className="flex items-center justify-center p-4 bg-slate-900 rounded-lg text-emerald-400 text-xs gap-2">
                <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                <span>در حال پردازش ۵۱۰×۵۱۰ و درج قالب واتر‌مارک...</span>
              </div>
            ) : imageUrl ? (
              <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
                <img src={imageUrl} alt="پیش‌نمایش" className="w-16 h-16 rounded-lg object-contain bg-white border border-slate-700 shadow" />
                <div className="text-xs space-y-0.5">
                  <p className="font-bold text-slate-200">پیش‌نمایش نهایی تصویر محصول</p>
                  <p className="text-[11px] text-slate-400">عکس آماده‌ی ثبت و ارسال مستقیم به ووکامرس می‌باشد.</p>
                </div>
              </div>
            ) : null}
          </div>

          {/* ACF Custom Fields preview */}
          <div className="bg-purple-950/20 border border-purple-800/40 p-3.5 rounded-xl space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>فیلدهای سفارشی (ACF) اولیه</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-purple-300 mb-1">نام برند (brand_name)</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="مثلاً: سامسونگ"
                  className="w-full bg-slate-950 border border-purple-800/60 rounded-lg px-3 py-1.5 text-xs text-purple-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] text-purple-300 mb-1">مدت گارانتی (warranty_period)</label>
                <input
                  type="text"
                  value={warrantyPeriod}
                  onChange={(e) => setWarrantyPeriod(e.target.value)}
                  placeholder="مثلاً: 18 ماه شرکتی"
                  className="w-full bg-slate-950 border border-purple-800/60 rounded-lg px-3 py-1.5 text-xs text-purple-200 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">توضیحات کوتاه</label>
            <textarea
              rows={2}
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
              placeholder="خلاصه‌ای از مهم‌ترین ویژگی‌های محصول..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Submit & Cancel */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-md shadow-emerald-950 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span>ایجاد و ثبت در ووکامرس</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
