/**
 * Utility to automatically apply the 510x510 official ArshGP watermark frame template to any given image file or image URL.
 */
export async function applyArshgpWatermark(
  source: File | string,
  options?: {
    canvasSize?: number;
    frameSize?: number;
    jpgQuality?: number;
  }
): Promise<string> {
  const cSize = options?.canvasSize || 510;
  const fSize = options?.frameSize || 501;
  const quality = (options?.jpgQuality || 95) / 100;

  return new Promise((resolve, reject) => {
    let imgSrc = '';

    if (typeof source === 'string') {
      imgSrc = source;
    } else {
      imgSrc = URL.createObjectURL(source);
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = cSize;
      canvas.height = cSize;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not supported'));
        return;
      }

      // 1. Fill canvas background white
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, cSize, cSize);

      // 2. Scale and center photo within frame
      const targetSize = fSize - 60; // 30px inner padding
      const scale = Math.min(targetSize / img.width, targetSize / img.height);
      const scaledW = img.width * scale;
      const scaledH = img.height * scale;
      const posX = (cSize - scaledW) / 2;
      const posY = (cSize - scaledH) / 2;

      ctx.drawImage(img, posX, posY, scaledW, scaledH);

      // 3. Draw ArshGP Official Watermark Frame Elements
      const offset = (cSize - fSize) / 2;

      // Dark Grey Corner Cuts
      ctx.fillStyle = '#6b7280';
      ctx.beginPath(); ctx.moveTo(offset, offset); ctx.lineTo(offset + 85, offset); ctx.lineTo(offset, offset + 42); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(offset + fSize, offset); ctx.lineTo(offset + fSize - 85, offset); ctx.lineTo(offset + fSize, offset + 42); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(offset, offset + fSize); ctx.lineTo(offset + 65, offset + fSize); ctx.lineTo(offset, offset + fSize - 38); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(offset + fSize, offset + fSize); ctx.lineTo(offset + fSize - 65, offset + fSize); ctx.lineTo(offset + fSize, offset + fSize - 38); ctx.closePath(); ctx.fill();

      // Outer border line
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(offset, offset, fSize, fSize);

      // Top Teal Pill (www.ArshGp.com)
      const pillW = 185;
      const pillH = 24;
      const pillX = (cSize - pillW) / 2;
      const pillY = offset + 4;

      ctx.fillStyle = '#00979d';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(pillX, pillY, pillW, pillH, 12);
      else ctx.rect(pillX, pillY, pillW, pillH);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'italic bold 12px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('www.ArshGp.com', cSize / 2, pillY + pillH / 2);

      // Top Right Title (عرش کـنـتـرل بـرنـا)
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

      // Bottom Badges
      const b1W = 185;
      const b1H = 22;

      // Sales Phone
      ctx.fillStyle = '#00979d';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(offset + 35, offset + fSize - 52, b1W, b1H, 8);
      else ctx.rect(offset + 35, offset + fSize - 52, b1W, b1H);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Tahoma, IRANSans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('33 93 94 75  :بخش فروش', offset + 35 + b1W / 2, offset + fSize - 40);

      // Technical Phone
      ctx.fillStyle = '#00979d';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(offset + 68, offset + fSize - 26, b1W - 20, b1H, 8);
      else ctx.rect(offset + 68, offset + fSize - 26, b1W - 20, b1H);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillText('33 93 94 78  :بخش فنی', offset + 68 + (b1W - 20) / 2, offset + fSize - 14);

      // WhatsApp
      const b2W = 185;
      ctx.fillStyle = '#00979d';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(offset + fSize - 35 - b2W, offset + fSize - 52, b2W, b1H, 8);
      else ctx.rect(offset + fSize - 35 - b2W, offset + fSize - 52, b2W, b1H);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Tahoma, sans-serif';
      ctx.fillText('09122094177   💬', offset + fSize - 35 - b2W / 2, offset + fSize - 40);

      // Email
      ctx.fillStyle = '#00979d';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(offset + fSize - 18 - b2W, offset + fSize - 26, b2W, b1H, 8);
      else ctx.rect(offset + fSize - 18 - b2W, offset + fSize - 26, b2W, b1H);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Arial, sans-serif';
      ctx.fillText('Arsh02Group@Gmail.com', offset + fSize - 18 - b2W / 2, offset + fSize - 14);

      const resultUrl = canvas.toDataURL('image/jpeg', quality);
      if (typeof source !== 'string') {
        URL.revokeObjectURL(imgSrc);
      }
      resolve(resultUrl);
    };

    img.onerror = (err) => {
      if (typeof source !== 'string') {
        URL.revokeObjectURL(imgSrc);
      }
      reject(err);
    };

    img.src = imgSrc;
  });
}
