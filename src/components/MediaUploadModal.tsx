import React, { useState, useRef, useEffect } from 'react';
import { WCProduct, WCConnectionConfig } from '../types';
import {
  X,
  Upload,
  Image as ImageIcon,
  FileText,
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FolderUp,
  Wand2,
  Download,
  Info,
  Check,
  RefreshCw,
  Layers,
  FileCheck
} from 'lucide-react';

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: WCProduct[];
  selectedProductIds: number[];
  config: WCConnectionConfig;
  onUpdateProductAcfAndImage: (
    productId: number,
    acfUpdates: Record<string, any>,
    newImageUrl?: string
  ) => void;
  onShowToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const MediaUploadModal: React.FC<MediaUploadModalProps> = ({
  isOpen,
  onClose,
  products,
  selectedProductIds,
  config,
  onUpdateProductAcfAndImage,
  onShowToast,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'image' | 'datasheet' | 'batch'>('image');

  // Single or Selected Target Product
  const targetProduct = products.find((p) => p.id === selectedProductIds[0]) || products[0];
  const [selectedProductId, setSelectedProductId] = useState<number>(targetProduct?.id || 0);

  // Canvas / Frame Settings matching Python Script
  const [canvasSize, setCanvasSize] = useState<number>(510);
  const [frameSize, setFrameSize] = useState<number>(501);
  const [innerMargin, setInnerMargin] = useState<number>(30);
  const [jpgQuality, setJpgQuality] = useState<number>(95);
  const [watermarkText, setWatermarkText] = useState<string>('ARSHGP | ORIGINAL PRODUCT');
  const [showWatermarkBadge, setShowWatermarkBadge] = useState<boolean>(true);
  const [useOfficialArshgpFrame, setUseOfficialArshgpFrame] = useState<boolean>(true);

  // Custom Frame File Upload
  const [customFrameFile, setCustomFrameFile] = useState<File | null>(null);
  const [customFramePreview, setCustomFramePreview] = useState<string | null>(null);

  // Image Upload State
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [originalImagePreview, setOriginalImagePreview] = useState<string | null>(null);
  const [processedImagePreview, setProcessedImagePreview] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState<boolean>(false);

  // Datasheet Upload State
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null);
  const [datasheetUrlBase, setDatasheetUrlBase] = useState<string>(
    config.siteUrl
      ? `${config.siteUrl.replace(/\/$/, '')}/wp-content/uploads/datasheet/`
      : 'https://arshgp.com/wp-content/uploads/datasheet/'
  );
  const [datasheetTargetField, setDatasheetTargetField] = useState<'datasheet' | 'datasheet2'>('datasheet');
  const [customDatasheetFilename, setCustomDatasheetFilename] = useState<string>('');

  // Batch Folder Indexer State
  const [batchLogs, setBatchLogs] = useState<string[]>([]);
  const [batchStats, setBatchStats] = useState<{ datasheetsFound: number; photosFound: number } | null>(null);
  const [isBatchProcessing, setIsBatchProcessing] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Update selected product if selection changes
  useEffect(() => {
    if (selectedProductIds.length > 0) {
      setSelectedProductId(selectedProductIds[0]);
    }
  }, [selectedProductIds]);

  // Handle Image File Drop/Select
  const handleImageFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      onShowToast('error', 'لطفاً یک فایل تصویری معتبر (JPG, PNG, WebP) انتخاب کنید.');
      return;
    }
    setSelectedImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setOriginalImagePreview(src);
      processImageOnCanvas(src);
    };
    reader.readAsDataURL(file);
  };

  // Render ARSHGP Official Watermark Frame matching the user's uploaded template
  const drawArshgpOfficialFrame = (
    ctx: CanvasRenderingContext2D,
    cSize: number,
    fSize: number
  ) => {
    const offset = (cSize - fSize) / 2;

    // 1. Dark Grey Outer Cut Corner Shapes
    ctx.fillStyle = '#6b7280';

    // Top-left corner triangle cut
    ctx.beginPath();
    ctx.moveTo(offset, offset);
    ctx.lineTo(offset + 85, offset);
    ctx.lineTo(offset, offset + 42);
    ctx.closePath();
    ctx.fill();

    // Top-right corner triangle cut
    ctx.beginPath();
    ctx.moveTo(offset + fSize, offset);
    ctx.lineTo(offset + fSize - 85, offset);
    ctx.lineTo(offset + fSize, offset + 42);
    ctx.closePath();
    ctx.fill();

    // Bottom-left corner triangle cut
    ctx.beginPath();
    ctx.moveTo(offset, offset + fSize);
    ctx.lineTo(offset + 65, offset + fSize);
    ctx.lineTo(offset, offset + fSize - 38);
    ctx.closePath();
    ctx.fill();

    // Bottom-right corner triangle cut
    ctx.beginPath();
    ctx.moveTo(offset + fSize, offset + fSize);
    ctx.lineTo(offset + fSize - 65, offset + fSize);
    ctx.lineTo(offset + fSize, offset + fSize - 38);
    ctx.closePath();
    ctx.fill();

    // Outer frame boundary line
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(offset, offset, fSize, fSize);

    // 2. Top Banner Elements
    // Top Center Teal Pill (www.ArshGp.com)
    const pillW = 185;
    const pillH = 24;
    const pillX = (cSize - pillW) / 2;
    const pillY = offset + 4;

    ctx.fillStyle = '#00979d';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(pillX, pillY, pillW, pillH, 12);
    } else {
      ctx.rect(pillX, pillY, pillW, pillH);
    }
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic bold 12px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('www.ArshGp.com', cSize / 2, pillY + pillH / 2);

    // Top Right Persian Title (عرش کـنـتـرل بـرنـا)
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 17px Tahoma, IRANSans, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('عرش کـنـتـرل بـرنـا', offset + fSize - 20, offset + 26);

    // Top Left ARSHGP Logo Mark
    ctx.fillStyle = '#00979d';
    ctx.beginPath();
    ctx.moveTo(offset + 14, offset + 10);
    ctx.lineTo(offset + 48, offset + 10);
    ctx.lineTo(offset + 72, offset + 46);
    ctx.lineTo(offset + 54, offset + 72);
    ctx.lineTo(offset + 38, offset + 46);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.moveTo(offset + 22, offset + 24);
    ctx.lineTo(offset + 38, offset + 24);
    ctx.lineTo(offset + 48, offset + 42);
    ctx.lineTo(offset + 36, offset + 60);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 8px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('ARSHGP', offset + 10, offset + 76);
    ctx.fillText('Arsh Control Borna', offset + 10, offset + 85);

    // 3. Bottom Badges (Sales, Tech, WhatsApp, Email)
    const b1W = 185;
    const b1H = 22;

    // Bottom Left Badge 1: Sales Phone (بخش فروش)
    ctx.fillStyle = '#00979d';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(offset + 35, offset + fSize - 52, b1W, b1H, 8);
    else ctx.rect(offset + 35, offset + fSize - 52, b1W, b1H);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Tahoma, IRANSans, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('33 93 94 75  :بخش فروش', offset + 35 + b1W / 2, offset + fSize - 40);

    // Bottom Left Badge 2: Technical Phone (بخش فنی)
    ctx.fillStyle = '#00979d';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(offset + 68, offset + fSize - 26, b1W - 20, b1H, 8);
    else ctx.rect(offset + 68, offset + fSize - 26, b1W - 20, b1H);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillText('33 93 94 78  :بخش فنی', offset + 68 + (b1W - 20) / 2, offset + fSize - 14);

    // Bottom Right Badge 1: WhatsApp (09122094177)
    const b2W = 185;
    ctx.fillStyle = '#00979d';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(offset + fSize - 35 - b2W, offset + fSize - 52, b2W, b1H, 8);
    else ctx.rect(offset + fSize - 35 - b2W, offset + fSize - 52, b2W, b1H);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Tahoma, sans-serif';
    ctx.fillText('09122094177   💬', offset + fSize - 35 - b2W / 2, offset + fSize - 40);

    // Bottom Right Badge 2: Email (Arsh02Group@Gmail.com)
    ctx.fillStyle = '#00979d';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(offset + fSize - 18 - b2W, offset + fSize - 26, b2W, b1H, 8);
    else ctx.rect(offset + fSize - 18 - b2W, offset + fSize - 26, b2W, b1H);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Arial, sans-serif';
    ctx.fillText('Arsh02Group@Gmail.com', offset + fSize - 18 - b2W / 2, offset + fSize - 14);
  };

  // Handle Custom Frame File Selection
  const handleCustomFrameChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      onShowToast('error', 'فایل قالب باید تصویر PNG شفاف باشد.');
      return;
    }
    setCustomFrameFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      setCustomFramePreview(src);
      if (originalImagePreview) {
        processImageOnCanvas(originalImagePreview, src);
      }
    };
    reader.readAsDataURL(file);
  };

  // Process image using HTML5 Canvas matching the Python / Photoshop script formula
  const processImageOnCanvas = (imageSrc: string, customFrameSrc?: string | null) => {
    setIsProcessingImage(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = canvasSize;
      canvas.height = canvasSize;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setIsProcessingImage(false);
        return;
      }

      // 1. White Background Canvas Fill
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasSize, canvasSize);

      // 2. Calculate scaling for photo within inner frame margin
      const targetImageSize = frameSize - innerMargin * 2;
      const w = img.width;
      const h = img.height;
      const scaleFactor = w > h ? targetImageSize / w : targetImageSize / h;
      const scaledW = w * scaleFactor;
      const scaledH = h * scaleFactor;

      // Center photo in canvas
      const posX = (canvasSize - scaledW) / 2;
      const posY = (canvasSize - scaledH) / 2;

      ctx.drawImage(img, posX, posY, scaledW, scaledH);

      const frameOffset = (canvasSize - frameSize) / 2;

      // 3. Draw Frame Overlay (Custom PNG or Vector Official Frame)
      const frameToDraw = customFrameSrc || customFramePreview;
      if (frameToDraw) {
        const frameImg = new Image();
        frameImg.crossOrigin = 'anonymous';
        frameImg.onload = () => {
          ctx.drawImage(frameImg, frameOffset, frameOffset, frameSize, frameSize);
          finalizeCanvasExport(canvas);
        };
        frameImg.onerror = () => {
          if (useOfficialArshgpFrame) drawArshgpOfficialFrame(ctx, canvasSize, frameSize);
          finalizeCanvasExport(canvas);
        };
        frameImg.src = frameToDraw;
      } else {
        if (useOfficialArshgpFrame) {
          drawArshgpOfficialFrame(ctx, canvasSize, frameSize);
        } else {
          // Standard clean frame border
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 3;
          ctx.strokeRect(frameOffset + 2, frameOffset + 2, frameSize - 4, frameSize - 4);
        }

        // 4. Draw Watermark Text Badge if custom enabled
        if (showWatermarkBadge && watermarkText.trim() && !useOfficialArshgpFrame) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fillRect(frameOffset + 12, canvasSize - frameOffset - 36, frameSize - 24, 26);

          ctx.font = 'bold 11px Tahoma, sans-serif';
          ctx.fillStyle = '#f8fafc';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(watermarkText.toUpperCase(), canvasSize / 2, canvasSize - frameOffset - 23);
        }

        finalizeCanvasExport(canvas);
      }
    };
    img.onerror = () => {
      setIsProcessingImage(false);
      onShowToast('error', 'خطا در بارگذاری پیش‌نمایش تصویر');
    };
    img.src = imageSrc;
  };

  const finalizeCanvasExport = (canvas: HTMLCanvasElement) => {
    const dataUrl = canvas.toDataURL('image/jpeg', jpgQuality / 100);
    setProcessedImagePreview(dataUrl);
    setIsProcessingImage(false);
  };

  // Trigger processing when slider settings change
  useEffect(() => {
    if (originalImagePreview) {
      processImageOnCanvas(originalImagePreview);
    }
  }, [canvasSize, frameSize, innerMargin, jpgQuality, watermarkText, showWatermarkBadge]);

  // Apply Processed Image to Product
  const handleApplyImage = () => {
    if (!processedImagePreview || !selectedProductId) {
      onShowToast('error', 'هیچ تصوری پردازش نشده است.');
      return;
    }

    onUpdateProductAcfAndImage(selectedProductId, {}, processedImagePreview);
    onShowToast('success', 'تصویر با موفقیت ریسایز، قاب‌بندی و به محصول اضافه شد!');
    onClose();
  };

  // Datasheet File Selection
  const handlePdfFileChange = (file: File) => {
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      onShowToast('error', 'لطفاً یک فایل PDF دیتاشیت انتخاب کنید.');
      return;
    }
    setSelectedPdfFile(file);
    const currentProd = products.find((p) => p.id === selectedProductId);
    const skuName = currentProd?.sku ? `${currentProd.sku}.pdf` : file.name;
    setCustomDatasheetFilename(skuName);
  };

  // Apply Datasheet URL to Product ACF
  const handleApplyDatasheet = () => {
    if (!selectedProductId) {
      onShowToast('error', 'لطفاً محصول مورد نظر را انتخاب کنید.');
      return;
    }

    const currentProd = products.find((p) => p.id === selectedProductId);
    const finalFilename = customDatasheetFilename.trim() || (selectedPdfFile ? selectedPdfFile.name : `${currentProd?.sku || 'datasheet'}.pdf`);
    const fullUrl = `${datasheetUrlBase.replace(/\/$/, '')}/${finalFilename}`;

    onUpdateProductAcfAndImage(selectedProductId, {
      [datasheetTargetField]: fullUrl,
    });

    onShowToast('success', `لینک دیتاشیت در فیلد ACF (${datasheetTargetField}) محصول ذخیره شد: ${fullUrl}`);
    onClose();
  };

  // Batch Auto Matching by SKU (Simulating Python Tab 1 process_excel)
  const handleRunBatchMatch = (files: FileList) => {
    setIsBatchProcessing(true);
    setBatchLogs([]);

    let dsCount = 0;
    let imgCount = 0;
    const logs: string[] = [];

    Array.from(files).forEach((file) => {
      const stem = file.name.replace(/\.[^/.]+$/, '').trim().toUpperCase();
      const isPdf = file.name.endsWith('.pdf');
      const isImg = /\.(jpg|jpeg|png|webp)$/i.test(file.name);

      const matchedProduct = products.find((p) => p.sku && p.sku.trim().toUpperCase() === stem);

      if (matchedProduct) {
        if (isPdf) {
          const dsUrl = `${datasheetUrlBase.replace(/\/$/, '')}/${file.name}`;
          onUpdateProductAcfAndImage(matchedProduct.id, { datasheet: dsUrl });
          dsCount++;
          logs.push(`✅ [دیتاشیت] تطبیق SKU: ${matchedProduct.sku} ➔ ${dsUrl}`);
        } else if (isImg) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const src = e.target?.result as string;
            onUpdateProductAcfAndImage(matchedProduct.id, {}, src);
          };
          reader.readAsDataURL(file);
          imgCount++;
          logs.push(`🖼️ [تصویر] تطبیق SKU: ${matchedProduct.sku} ➔ ${file.name}`);
        }
      } else {
        logs.push(`⚠️ فایل بدون SKU تطبیق‌یافته: ${file.name}`);
      }
    });

    setBatchStats({ datasheetsFound: dsCount, photosFound: imgCount });
    setBatchLogs(logs);
    setIsBatchProcessing(false);
    onShowToast('success', `پردازش دسته‌جمعی انجام شد! ${dsCount} دیتاشیت و ${imgCount} تصویر متصل شدند.`);
  };

  const currentProdObj = products.find((p) => p.id === selectedProductId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-inner">
              <Wand2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <span>استودیو آپلود، ریسایز و دیتاشیت (ARSHGP Toolkit)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                آپلود مستقیم تصاویر، پردازش قاب و واتر‌مارک اتوماتیک، و ذخیره فایل‌های PDF دیتاشیت در <code className="text-emerald-400 font-mono">uploads/datasheet</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="bg-slate-950/80 px-6 border-b border-slate-800 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('image')}
            className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'image'
                ? 'border-emerald-500 text-emerald-300 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-emerald-400" />
            <span>پردازش و آپلود عکس (واترمارک و قاب)</span>
          </button>

          <button
            onClick={() => setActiveTab('datasheet')}
            className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'datasheet'
                ? 'border-emerald-500 text-emerald-300 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>آپلود دیتاشیت PDF (فیلد datasheet)</span>
          </button>

          <button
            onClick={() => setActiveTab('batch')}
            className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'batch'
                ? 'border-emerald-500 text-emerald-300 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderUp className="w-4 h-4 text-purple-400" />
            <span>تطبیق و اتصال دسته‌جمعی با SKU</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-slate-300">
          {/* Target Product Selection Bar */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-slate-400 shrink-0 font-semibold">محصول هدف:</span>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none w-full sm:w-80"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.sku || p.id}] {p.name.substring(0, 45)}...
                  </option>
                ))}
              </select>
            </div>

            {currentProdObj && (
              <div className="text-[11px] text-slate-400 flex items-center gap-2 self-end sm:self-auto">
                <span className="bg-slate-800 px-2 py-0.5 rounded text-emerald-300 font-mono">
                  SKU: {currentProdObj.sku || 'N/A'}
                </span>
                <span className="bg-slate-800 px-2 py-0.5 rounded text-purple-300">
                  {currentProdObj.categories[0]?.name || 'بدون دسته'}
                </span>
              </div>
            )}
          </div>

          {/* TAB 1: IMAGE PROCESSING & WATERMARK */}
          {activeTab === 'image' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
              {/* Controls Column */}
              <div className="lg:col-span-5 space-y-4">
                {/* File Dropzone */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files[0]) handleImageFileChange(e.dataTransfer.files[0]);
                  }}
                  className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 bg-slate-950/60 p-5 rounded-2xl text-center space-y-2 cursor-pointer transition-colors"
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    id="modal-image-upload-input"
                    onChange={(e) => e.target.files?.[0] && handleImageFileChange(e.target.files[0])}
                  />
                  <label htmlFor="modal-image-upload-input" className="cursor-pointer block">
                    <Upload className="w-8 h-8 text-emerald-400 mx-auto mb-1 animate-pulse" />
                    <span className="font-bold text-slate-200 block text-xs">انتخاب یا درگ تصویر محصول</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">پشتیبانی از فرمت‌های JPG, PNG, WebP</span>
                  </label>
                </div>

                {/* Processing Parameters Box (matching Photoshop JSX controls) */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <h3 className="font-bold text-slate-200 text-xs flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-emerald-400" />
                    <span>تنظیمات ابعاد قاب و واترمارک (Photoshop Rules)</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <label className="block text-slate-400 mb-1">ابعاد بوم (canvasSize):</label>
                      <input
                        type="number"
                        value={canvasSize}
                        onChange={(e) => setCanvasSize(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 font-mono text-center"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">اندازه قاب (frameSize):</label>
                      <input
                        type="number"
                        value={frameSize}
                        onChange={(e) => setFrameSize(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 font-mono text-center"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">حاشیه داخلی (innerMargin):</label>
                      <input
                        type="number"
                        value={innerMargin}
                        onChange={(e) => setInnerMargin(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 font-mono text-center"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1">کیفیت خروجی (JPG Quality):</label>
                      <input
                        type="number"
                        min={10}
                        max={100}
                        value={jpgQuality}
                        onChange={(e) => setJpgQuality(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 font-mono text-center"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">متن واترمارک / برند روی عکس:</label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="مثلاً: ARSHGP | SIEMENS"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100"
                    />
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="official-arshgp-frame-toggle"
                        checked={useOfficialArshgpFrame}
                        onChange={(e) => {
                          setUseOfficialArshgpFrame(e.target.checked);
                          if (originalImagePreview) {
                            processImageOnCanvas(originalImagePreview);
                          }
                        }}
                        className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                      />
                      <label htmlFor="official-arshgp-frame-toggle" className="text-[11px] font-bold text-emerald-300 cursor-pointer flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>اعمال قالب رسمی واتر‌مارک «عرش کنترل برنا» (ArshGP)</span>
                      </label>
                    </div>

                    {/* Custom Frame PNG Uploader */}
                    <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 space-y-1.5 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-300 font-semibold">یا آپلود فایل قالب PNG اختصاصی (frame.png):</span>
                        {customFrameFile && (
                          <span className="text-[10px] text-emerald-400 font-mono">
                            ✓ {customFrameFile.name}
                          </span>
                        )}
                      </div>
                      <label className="block w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-center rounded-lg text-[11px] cursor-pointer transition-colors border border-slate-700">
                        <span>انتخاب فایل frame.png شفاف</span>
                        <input
                          type="file"
                          accept="image/png,image/webp"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleCustomFrameChange(e.target.files[0])}
                        />
                      </label>
                    </div>

                    {!useOfficialArshgpFrame && (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id="watermark-toggle"
                          checked={showWatermarkBadge}
                          onChange={(e) => setShowWatermarkBadge(e.target.checked)}
                          className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                        />
                        <label htmlFor="watermark-toggle" className="text-[11px] text-slate-300 cursor-pointer">
                          نمایش نوار واترمارک متنی ساده در پایین
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Preview Canvas Column */}
              <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                <h3 className="font-bold text-xs text-slate-200 flex items-center gap-2 self-start">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>پیش‌نمایش زنده خروجی (بوم {canvasSize}x{canvasSize} پیکسل)</span>
                </h3>

                <div className="relative w-64 h-64 sm:w-72 sm:h-72 bg-white rounded-lg shadow-2xl border border-slate-700 overflow-hidden flex items-center justify-center">
                  {processedImagePreview ? (
                    <img
                      src={processedImagePreview}
                      alt="Processed Framed Preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-6 text-slate-400">
                      <ImageIcon className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs">تصویری انتخاب نشده است.</p>
                      <p className="text-[10px] text-slate-500 mt-1">از پنل سمت راست یک عکس بارگذاری کنید.</p>
                    </div>
                  )}

                  {isProcessingImage && (
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center text-emerald-300 gap-2 font-bold text-xs">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>در حال اعمال قاب و واتر‌مارک...</span>
                    </div>
                  )}
                </div>

                <div className="w-full flex items-center justify-between pt-2">
                  <span className="text-[10px] text-slate-400">
                    وضعیت: {processedImagePreview ? 'آماده اعمال روی محصول' : 'منتظر انتخاب تصویر'}
                  </span>

                  <button
                    onClick={handleApplyImage}
                    disabled={!processedImagePreview}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-950 disabled:opacity-40 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تایید و اتصال عکس به محصول</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATASHEET PDF UPLOAD */}
          {activeTab === 'datasheet' && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-emerald-950/20 border border-emerald-800/40 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                  <Info className="w-4 h-4 text-emerald-400" />
                  <span>ساختار مسیر آپلود دیتاشیت در وب‌سایت</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  فایل‌های کاتالوگ و دیتاشیت فنی به صورت خودکار در مسیر <code className="text-emerald-400 font-mono font-bold bg-slate-950 px-1.5 py-0.5 rounded">wp-content/uploads/datasheet/</code> ذخیره شده و لینک مستقیم آن در فیلدهای ACF قرار می‌گیرد.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* File Dropzone */}
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files[0]) handlePdfFileChange(e.dataTransfer.files[0]);
                  }}
                  className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 bg-slate-950/60 p-6 rounded-2xl text-center space-y-3 cursor-pointer transition-colors flex flex-col items-center justify-center min-h-[180px]"
                >
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    id="modal-pdf-upload-input"
                    onChange={(e) => e.target.files?.[0] && handlePdfFileChange(e.target.files[0])}
                  />
                  <label htmlFor="modal-pdf-upload-input" className="cursor-pointer block">
                    <FileText className="w-10 h-10 text-emerald-400 mx-auto mb-2 animate-pulse" />
                    <span className="font-bold text-slate-200 block text-xs">انتخاب یا رهاسازی فایل PDF دیتاشیت</span>
                    {selectedPdfFile ? (
                      <span className="text-emerald-400 font-bold block text-xs mt-2 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                        ✓ فایل انتخاب شده: {selectedPdfFile.name}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 block mt-1">حداکثر حجم مجاز: ۵۰ مگابایت</span>
                    )}
                  </label>
                </div>

                {/* Form Fields */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <h3 className="font-bold text-slate-200 text-xs">تنظیمات فیلد و آدرس وب‌سایت</h3>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">آدرس پایه پوشه دیتاشیت:</label>
                    <input
                      type="text"
                      value={datasheetUrlBase}
                      onChange={(e) => setDatasheetUrlBase(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-emerald-300 font-mono dir-ltr text-left focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">نام فایل نهایی (بر اساس SKU):</label>
                    <input
                      type="text"
                      value={customDatasheetFilename}
                      onChange={(e) => setCustomDatasheetFilename(e.target.value)}
                      placeholder="مثلاً: 6ES7214-1AG40-0XB0.pdf"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[11px] mb-1">فیلد ACF مقصد در محصول:</label>
                    <select
                      value={datasheetTargetField}
                      onChange={(e) => setDatasheetTargetField(e.target.value as any)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                    >
                      <option value="datasheet">فیلد اصلی: datasheet (دیتا شیت)</option>
                      <option value="datasheet2">فیلد دوم: datasheet2 (کاتالوگ مکمل)</option>
                    </select>
                  </div>

                  <button
                    onClick={handleApplyDatasheet}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-950 flex items-center justify-center gap-2 mt-2"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>ثبت و ذخیره لینک دیتاشیت در محصول</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BATCH SKU AUTO-MATCHER */}
          {activeTab === 'batch' && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-purple-950/20 border border-purple-800/40 p-4 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-purple-300 font-bold text-xs">
                  <FolderUp className="w-4 h-4 text-purple-400" />
                  <span>تطبیق هوشمند گروهی بر اساس نام فایل‌ها با SKU</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  گروهی از فایل‌های تصاویر یا PDF کاتالوگ‌ها را انتخاب کنید. سیستم به صورت اتوماتیک نام فایل‌ها (مثلا <code className="text-purple-300 font-mono">6ES7214-1AG40-0XB0.pdf</code>) را با SKU محصولات تطبیق داده و لینک دیتاشیت و عکس‌ها را تنظیم می‌کند.
                </p>
              </div>

              <div className="border-2 border-dashed border-purple-500/40 hover:border-purple-400 bg-slate-950/60 p-6 rounded-2xl text-center space-y-3 cursor-pointer transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  className="hidden"
                  id="modal-batch-upload-input"
                  onChange={(e) => e.target.files && handleRunBatchMatch(e.target.files)}
                />
                <label htmlFor="modal-batch-upload-input" className="cursor-pointer block">
                  <FolderUp className="w-10 h-10 text-purple-400 mx-auto mb-2 animate-bounce" />
                  <span className="font-bold text-slate-200 block text-xs">انتخاب دسته جمعی تمامی تصاویر و فایل‌های دیتاشیت</span>
                  <span className="text-[10px] text-slate-400 block mt-1">تطبیق اتوماتیک بر اساس SKU انبار</span>
                </label>
              </div>

              {/* Logs */}
              {batchLogs.length > 0 && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 max-h-48 overflow-y-auto">
                  <h4 className="font-bold text-xs text-slate-200">گزارش پردازش دسته‌جمعی:</h4>
                  {batchLogs.map((log, idx) => (
                    <div key={idx} className="text-[11px] font-mono text-slate-300 py-0.5 border-b border-slate-900">
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 hidden sm:block">
            ARSHGP Toolkit — پردازش اختصاصی بوم 510x510 و پشتیبانی کامل از uploads/datasheet
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors mr-auto"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};
