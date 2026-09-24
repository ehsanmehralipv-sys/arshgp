import { ReferenceSnapshot, ReferenceSummary, WCProduct, WCCategory, WCConnectionConfig } from '../types';

const ACTIVE_REF_KEY = 'wc_active_ref_code';
const LOCAL_SNAPSHOTS_KEY = 'wc_local_snapshots';

// Generate a random, friendly, memorable reference code like REF-58392
export function generateReferenceCode(): string {
  const randomNum = Math.floor(10000 + Math.random() * 90000);
  return `REF-${randomNum}`;
}

// Get active reference code
export function getActiveReferenceCode(): string | null {
  try {
    return localStorage.getItem(ACTIVE_REF_KEY);
  } catch {
    return null;
  }
}

// Set active reference code
export function setActiveReferenceCode(refCode: string | null): void {
  try {
    if (refCode) {
      localStorage.setItem(ACTIVE_REF_KEY, refCode.trim().toUpperCase());
    } else {
      localStorage.removeItem(ACTIVE_REF_KEY);
    }
  } catch (e) {
    console.warn('Could not set active ref code:', e);
  }
}

// Save snapshot locally and to server
export async function saveSnapshot(
  refCode: string,
  data: {
    title?: string;
    siteUrl?: string;
    products: WCProduct[];
    categories: WCCategory[];
    config?: Partial<WCConnectionConfig>;
    pendingChanges?: Record<number, Partial<WCProduct>>;
  }
): Promise<{ success: boolean; snapshot: ReferenceSnapshot; message?: string }> {
  const cleanCode = refCode.trim().toUpperCase();

  const snapshot: ReferenceSnapshot = {
    refCode: cleanCode,
    title: data.title || `محصولات ${new Date().toLocaleDateString('fa-IR')}`,
    siteUrl: data.siteUrl || data.config?.siteUrl || 'demo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    productCount: data.products.length,
    products: data.products,
    categories: data.categories,
    config: data.config,
    pendingChanges: data.pendingChanges,
  };

  // 1. Save in LocalStorage
  try {
    const rawLocal = localStorage.getItem(LOCAL_SNAPSHOTS_KEY);
    const localStore = rawLocal ? JSON.parse(rawLocal) : {};
    localStore[cleanCode] = snapshot;
    localStorage.setItem(LOCAL_SNAPSHOTS_KEY, JSON.stringify(localStore));
    setActiveReferenceCode(cleanCode);
  } catch (e) {
    console.warn('Could not save snapshot to localStorage (quota may be full):', e);
  }

  // 2. Save to Server Backend
  try {
    const res = await fetch('/api/wc/snapshot/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(snapshot),
    });
    if (res.ok) {
      const serverRes = await res.json();
      if (serverRes.success) {
        return { success: true, snapshot, message: serverRes.message };
      }
    }
  } catch (e) {
    console.warn('Could not sync snapshot with backend server:', e);
  }

  return { success: true, snapshot, message: `داده‌ها با کد ${cleanCode} ذخیره شدند.` };
}

// Get snapshot by refCode (try LocalStorage first, then Server)
export async function getSnapshot(refCode: string): Promise<ReferenceSnapshot | null> {
  const cleanCode = refCode.trim().toUpperCase();

  // 1. Try LocalStorage for instant zero-latency loading
  try {
    const rawLocal = localStorage.getItem(LOCAL_SNAPSHOTS_KEY);
    if (rawLocal) {
      const localStore = JSON.parse(rawLocal);
      if (localStore[cleanCode]) {
        return localStore[cleanCode];
      }
    }
  } catch (e) {
    console.warn('LocalStorage read error:', e);
  }

  // 2. Try Server
  try {
    const res = await fetch(`/api/wc/snapshot/get/${encodeURIComponent(cleanCode)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.snapshot) {
        // Cache locally for next time
        try {
          const rawLocal = localStorage.getItem(LOCAL_SNAPSHOTS_KEY);
          const localStore = rawLocal ? JSON.parse(rawLocal) : {};
          localStore[cleanCode] = data.snapshot;
          localStorage.setItem(LOCAL_SNAPSHOTS_KEY, JSON.stringify(localStore));
        } catch {}
        return data.snapshot;
      }
    }
  } catch (e) {
    console.warn('Server snapshot read error:', e);
  }

  return null;
}

// List all saved snapshots (combined local + server)
export async function listSnapshots(): Promise<ReferenceSummary[]> {
  const map = new Map<string, ReferenceSummary>();

  // 1. Read from LocalStorage
  try {
    const rawLocal = localStorage.getItem(LOCAL_SNAPSHOTS_KEY);
    if (rawLocal) {
      const localStore = JSON.parse(rawLocal);
      for (const key of Object.keys(localStore)) {
        const snap = localStore[key];
        map.set(snap.refCode, {
          refCode: snap.refCode,
          title: snap.title,
          siteUrl: snap.siteUrl,
          createdAt: snap.createdAt,
          updatedAt: snap.updatedAt,
          productCount: snap.productCount || snap.products?.length || 0,
        });
      }
    }
  } catch (e) {
    console.warn('Could not list local snapshots:', e);
  }

  // 2. Read from Server
  try {
    const res = await fetch('/api/wc/snapshot/list');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.snapshots)) {
        for (const snap of data.snapshots) {
          map.set(snap.refCode, snap);
        }
      }
    }
  } catch (e) {
    console.warn('Could not fetch server snapshot list:', e);
  }

  const list = Array.from(map.values());
  list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return list;
}

// Delete snapshot
export async function deleteSnapshot(refCode: string): Promise<boolean> {
  const cleanCode = refCode.trim().toUpperCase();

  // 1. Remove from LocalStorage
  try {
    const rawLocal = localStorage.getItem(LOCAL_SNAPSHOTS_KEY);
    if (rawLocal) {
      const localStore = JSON.parse(rawLocal);
      delete localStore[cleanCode];
      localStorage.setItem(LOCAL_SNAPSHOTS_KEY, JSON.stringify(localStore));
    }
    if (getActiveReferenceCode() === cleanCode) {
      setActiveReferenceCode(null);
    }
  } catch (e) {
    console.warn('LocalStorage delete error:', e);
  }

  // 2. Remove from Server
  try {
    await fetch(`/api/wc/snapshot/delete/${encodeURIComponent(cleanCode)}`, {
      method: 'DELETE',
    });
  } catch (e) {
    console.warn('Server delete error:', e);
  }

  return true;
}

// Export Snapshot directly as downloadable JSON file
export function exportSnapshotFile(snapshot: ReferenceSnapshot): void {
  const cleanCode = snapshot.refCode || 'SNAPSHOT';
  const siteDomain = snapshot.siteUrl ? snapshot.siteUrl.replace(/^https?:\/\//, '').replace(/[^\w.-]/g, '_') : 'store';
  const filename = `wc-ref-${cleanCode}-${siteDomain}.json`;

  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Parse and import Snapshot from uploaded JSON File
export async function parseSnapshotFile(file: File): Promise<{
  success: boolean;
  snapshot?: ReferenceSnapshot;
  message?: string;
}> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed.products || !Array.isArray(parsed.products)) {
          resolve({
            success: false,
            message: 'ساختار فایل پشتیبان نامعتبر است (آرایه محصولات یافت نشد).',
          });
          return;
        }

        const refCode = (parsed.refCode || generateReferenceCode()).trim().toUpperCase();
        const saved = await saveSnapshot(refCode, {
          title: parsed.title || `فایل ایمپورت‌شده (${parsed.products.length} محصول)`,
          siteUrl: parsed.siteUrl,
          products: parsed.products,
          categories: parsed.categories || [],
          config: parsed.config || {},
          pendingChanges: parsed.pendingChanges || {},
        });

        resolve({
          success: true,
          snapshot: saved.snapshot,
          message: `فایل با موفقیت بارگذاری و با کد رفرنس ${refCode} ذخیره شد.`,
        });
      } catch (err: any) {
        resolve({
          success: false,
          message: `خطا در تجزیه فایل JSON: ${err.message || err}`,
        });
      }
    };
    reader.onerror = () => {
      resolve({
        success: false,
        message: 'خطا در خواندن فایل از دیسک.',
      });
    };
    reader.readAsText(file);
  });
}
