import { WCProduct } from '../types';

export type SeoHealthStatus =
  | 'excellent'
  | 'growing'
  | 'stable'
  | 'at_risk_drop'
  | 'severe_drop'
  | 'underperforming'
  | 'needs_index';

export type IndexStatusType =
  | 'INDEXED'
  | 'NOT_INDEXED'
  | 'CRAWLED_NOT_INDEXED'
  | 'SUBMITTED_INDEX_REQUESTED'
  | 'DISCOVERED_NOT_INDEXED'
  | 'REDIRECT_ERROR'
  | 'SERVER_ERROR_5XX';

export interface GSCQueryData {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number; // percentage, e.g. 4.2
  position: number; // e.g. 3.4
  previousPosition: number;
  positionChange: number; // e.g. +2.1 (improvement) or -3.5 (drop)
  clicksChange: number;
  trend: 'up' | 'down' | 'stable' | 'new';
}

export interface SeoActionTask {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'content_update' | 'meta_optimization' | 'faq_schema' | 'internal_link' | 'technical_index';
  status: 'pending' | 'in_progress' | 'completed' | 'scheduled';
  startDate: string;
  predictedFinishDate: string;
  postCheckDate: string;
  predictedRankImpact: string;
  suggestedContentPatch?: {
    seoTitle?: string;
    focusKeyword?: string;
    metaDescription?: string;
    contentAddition?: string;
    faqList?: Array<{ question: string; answer: string }>;
  };
}

export interface RankingTrendPoint {
  date: string;
  position: number;
  clicks: number;
  impressions: number;
}

export interface PageSeoInsight {
  productId: number;
  productTitle: string;
  productSlug: string;
  pageUrl: string;
  productSku?: string;
  categoryName?: string;
  price?: string;
  featuredImage?: string;

  // GSC Performance (Last 28 days vs Previous 28 days)
  clicks: number;
  previousClicks: number;
  clicksChangePercent: number;

  impressions: number;
  previousImpressions: number;
  impressionsChangePercent: number;

  ctr: number;
  previousCtr: number;

  averagePosition: number;
  previousAveragePosition: number;
  positionChange: number; // positive = improvement (closer to #1), negative = drop

  // GA4 Metrics
  gaVisits: number;
  gaUsers: number;
  gaBounceRate: number; // e.g. 38%
  gaAvgSessionSeconds: number; // e.g. 142s
  gaTopTrafficSources: Array<{ source: string; percentage: number }>;
  gaTopCountries: Array<{ country: string; flag: string; visits: number }>;

  // Rank Math & Technical SEO
  rankMathScore: number; // 0-100
  focusKeyword: string;
  seoTitle: string;
  seoDescription: string;
  schemaType: string;
  indexStatus: IndexStatusType;
  lastCrawledDate?: string;
  lastIndexRequestedDate?: string;
  hasCanonicalIssue: boolean;
  needsContentUpdate: boolean;

  // Trend history (last 4 weeks / checkpoints)
  trendHistory: RankingTrendPoint[];

  // Top Queries in GSC for this page
  queries: GSCQueryData[];

  // AI Diagnostic & Action Plan
  aiAnalysis?: {
    statusSummary: string;
    healthStatus: SeoHealthStatus;
    rootCause: string;
    contentUpdateReason?: string;
    tasks: SeoActionTask[];
    generatedAt: string;
  };
}

export interface ContentGapOpportunity {
  id: string;
  query: string;
  impressions: number;
  estimatedMonthlyClicks: number;
  currentBestRankingPage?: string | null;
  currentPosition?: number | null;
  opportunityScore: number; // 1-100
  categoryName: string;
  suggestedAction: 'create_product' | 'create_category' | 'create_blog';
  aiProposedProduct?: {
    name: string;
    regular_price: string;
    short_description: string;
    description: string;
    focusKeyword: string;
    seoTitle: string;
    metaDescription: string;
    faqList: Array<{ question: string; answer: string }>;
  };
}

export interface CannibalizationIssue {
  id: string;
  query: string;
  totalImpressions: number;
  competingPages: Array<{
    productId: number;
    title: string;
    url: string;
    position: number;
    clicks: number;
    ctr: number;
  }>;
  aiDiagnosis: string;
  recommendedAction: string;
}

export interface GSCConnectionConfig {
  isConnected: boolean;
  propertyUrl: string;
  authMethod: 'demo' | 'service_account' | 'oauth';
  serviceAccountEmail?: string;
  ga4PropertyId?: string;
  dateRange: '7d' | '28d' | '3m' | '6m' | '12m';
  lastSyncedAt?: string;
}
