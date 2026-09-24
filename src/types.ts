export interface WCCategory {
  id: number;
  name: string;
  slug: string;
  parent?: number;
  count?: number;
  description?: string;
  image?: { id?: number; src?: string };
}

export interface WCImage {
  id?: number;
  src: string;
  alt?: string;
  name?: string;
}

export interface WCTag {
  id: number;
  name: string;
  slug: string;
}

export interface ProductACF {
  [key: string]: string | number | boolean | Array<string | number> | null;
}

export interface WCProduct {
  id: number;
  name: string;
  slug: string;
  permalink?: string;
  sku: string;
  regular_price: string;
  sale_price: string;
  price: string;
  status: 'publish' | 'draft' | 'pending' | 'private';
  stock_status: 'instock' | 'outofstock' | 'onbackorder';
  stock_quantity: number | null;
  categories: WCCategory[];
  tags?: WCTag[];
  images: WCImage[];
  short_description: string;
  description: string;
  acf: ProductACF;
  meta_data?: Array<{ id?: number; key: string; value: any }>;
  date_created?: string;
  date_modified?: string;
  featured?: boolean;
}

export interface WCConnectionConfig {
  siteUrl: string;
  consumerKey: string;
  consumerSecret: string;
  useProxy: boolean;
  isDemoMode: boolean;
  batchSize?: number; // e.g. 50 (recommended), 25 (light host), 100 (fast host)
  requestDelay?: number; // ms delay between page batches (e.g. 200ms)
}

export interface ModifiedCell {
  productId: number;
  field: string; // e.g. 'name', 'regular_price', 'sale_price', 'sku', 'stock_quantity', 'stock_status', 'categories', 'status', 'acf.my_key'
  oldValue: any;
  newValue: any;
}

export interface PendingProductChange {
  productId: number;
  changes: Partial<WCProduct>;
  acfChanges: Record<string, any>;
  isNew?: boolean;
}

export interface BulkOperationOptions {
  type: 'price_increase_percent' | 'price_decrease_percent' | 'price_fixed_add' | 'price_fixed_set' | 'category_add' | 'category_set' | 'stock_status' | 'product_status' | 'delete';
  value: any;
  targetProductIds: number[];
}

export interface ColumnDefinition {
  id: string;
  label: string;
  width: number;
  visible: boolean;
  isAcf?: boolean;
  acfKey?: string;
  editable: boolean;
}

export interface FetchProgress {
  loaded: number;
  total: number;
  currentPage: number;
  totalPages: number;
  status: 'fetching' | 'paused' | 'completed' | 'error';
  currentAction?: string;
  failedPages?: number[];
}

export interface ReferenceSnapshot {
  refCode: string;
  title?: string;
  siteUrl: string;
  createdAt: string;
  updatedAt: string;
  productCount: number;
  products: WCProduct[];
  categories: WCCategory[];
  config?: Partial<WCConnectionConfig>;
  pendingChanges?: Record<number, Partial<WCProduct>>;
}

export interface ReferenceSummary {
  refCode: string;
  title?: string;
  siteUrl: string;
  createdAt: string;
  updatedAt: string;
  productCount: number;
}
