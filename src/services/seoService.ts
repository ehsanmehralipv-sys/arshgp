import { WCProduct, WCCategory } from '../types';
import {
  PageSeoInsight,
  GSCQueryData,
  ContentGapOpportunity,
  CannibalizationIssue,
  GSCConnectionConfig,
  SeoActionTask,
} from '../types/seoTypes';

const SEO_CONFIG_KEY = 'wc_sheet_seo_config_v1';
const SEO_CUSTOM_TASKS_KEY = 'wc_sheet_seo_tasks_v1';

// Default GSC config
export function getStoredSeoConfig(): GSCConnectionConfig {
  try {
    const raw = localStorage.getItem(SEO_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  return {
    isConnected: true,
    propertyUrl: 'https://myshop.ir',
    authMethod: 'demo',
    dateRange: '28d',
    lastSyncedAt: new Date().toISOString(),
  };
}

export function saveStoredSeoConfig(config: GSCConnectionConfig): void {
  try {
    localStorage.setItem(SEO_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {}
}

// Generate realistic Persian GSC queries based on product name and category
function generateQueriesForProduct(product: WCProduct, categoryName: string): GSCQueryData[] {
  const title = product.name || 'محصول';
  const cleanTitle = title.replace(/[^\u0600-\u06FF0-9a-zA-Z\s]/g, '').trim();
  const words = cleanTitle.split(' ').filter(Boolean);
  const baseKeyword = words.slice(0, 3).join(' ');

  const templates = [
    { prefix: 'خرید ', suffix: '', weight: 1.0 },
    { prefix: 'قیمت ', suffix: ' اصل', weight: 0.85 },
    { prefix: 'بهترین ', suffix: '', weight: 0.7 },
    { prefix: '', suffix: ' دیجی کالا', weight: 0.6 },
    { prefix: 'مشخصات و راهنمای خرید ', suffix: '', weight: 0.5 },
    { prefix: 'فروشگاه اینترنتی ', suffix: '', weight: 0.4 },
    { prefix: 'ارزانترین قیمت ', suffix: '', weight: 0.35 },
    { prefix: 'نظرات خریداران در مورد ', suffix: '', weight: 0.3 },
  ];

  // Deterministic seed based on product ID
  const seed = (product.id * 9301 + 49297) % 233280;
  const rand = (offset: number) => ((seed + offset * 1337) % 1000) / 1000;

  const baseRank = 2 + Math.floor(rand(1) * 22); // e.g. Rank 2 to 24
  const rankDelta = Math.round((rand(2) * 8 - 4) * 10) / 10; // -4.0 to +4.0
  const prevRank = Math.max(1.1, Math.min(45, baseRank - rankDelta));

  const totalBaseImpressions = 1500 + Math.floor(rand(3) * 12000);

  return templates.slice(0, 4 + Math.floor(rand(4) * 4)).map((t, idx) => {
    const qText = `${t.prefix}${baseKeyword}${t.suffix}`.trim();
    const querySeed = (seed + idx * 7919) % 10000;
    const qRankDelta = Math.round((((querySeed % 100) / 100) * 6 - 3) * 10) / 10;
    const qPosition = Math.max(1.2, Math.min(38, baseRank + (idx * 1.5) + qRankDelta));
    const qPrevPosition = Math.max(1.2, Math.min(42, qPosition - qRankDelta));

    // CTR curve based on position (e.g. pos 1 = ~25%, pos 3 = ~10%, pos 10 = ~2%)
    const expectedCtr = Math.max(0.8, Math.min(32, 28 / Math.pow(qPosition, 0.75)));
    const impressions = Math.max(80, Math.floor(totalBaseImpressions * t.weight * (0.8 + ((querySeed % 40) / 100))));
    const clicks = Math.max(2, Math.round((impressions * expectedCtr) / 100));

    const positionChange = Math.round((qPrevPosition - qPosition) * 10) / 10; // positive = improvement
    const clicksChange = Math.round(((querySeed % 60) - 25));

    let trend: 'up' | 'down' | 'stable' | 'new' = 'stable';
    if (positionChange >= 1.5) trend = 'up';
    else if (positionChange <= -1.5) trend = 'down';
    else if (idx === 3 && rand(5) > 0.6) trend = 'new';

    return {
      query: qText,
      clicks,
      impressions,
      ctr: Math.round((clicks / impressions) * 1000) / 10,
      position: Math.round(qPosition * 10) / 10,
      previousPosition: Math.round(qPrevPosition * 10) / 10,
      positionChange,
      clicksChange,
      trend,
    };
  });
}

// Build comprehensive SEO insights for all products
export function generateSeoInsights(
  products: WCProduct[],
  siteUrl: string = 'https://myshop.ir'
): PageSeoInsight[] {
  const cleanSite = siteUrl ? siteUrl.replace(/\/$/, '') : 'https://myshop.ir';

  return products.map((product, index) => {
    const seed = (product.id * 7919 + index * 104729) % 233280;
    const rand = (offset: number) => ((seed + offset * 31337) % 1000) / 1000;

    const categoryName = product.categories?.[0]?.name || 'عمومی';
    const queries = generateQueriesForProduct(product, categoryName);

    const totalClicks = queries.reduce((acc, q) => acc + q.clicks, 0);
    const totalImpressions = queries.reduce((acc, q) => acc + q.impressions, 0);
    const avgPosition =
      queries.length > 0
        ? Math.round((queries.reduce((acc, q) => acc + q.position, 0) / queries.length) * 10) / 10
        : 12.5;

    const prevAvgPosition =
      queries.length > 0
        ? Math.round((queries.reduce((acc, q) => acc + q.previousPosition, 0) / queries.length) * 10) / 10
        : 14.2;

    const positionChange = Math.round((prevAvgPosition - avgPosition) * 10) / 10; // positive = gain, negative = drop

    const prevClicks = Math.max(10, Math.round(totalClicks * (1 - (positionChange * 0.08) + ((rand(1) - 0.5) * 0.1))));
    const clicksChangePercent = prevClicks > 0 ? Math.round(((totalClicks - prevClicks) / prevClicks) * 100) : 0;

    const prevImpressions = Math.max(100, Math.round(totalImpressions * (1 - (positionChange * 0.05) + ((rand(2) - 0.5) * 0.1))));
    const impressionsChangePercent =
      prevImpressions > 0 ? Math.round(((totalImpressions - prevImpressions) / prevImpressions) * 100) : 0;

    const ctr = totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 1000) / 10 : 0;
    const previousCtr = prevImpressions > 0 ? Math.round((prevClicks / prevImpressions) * 1000) / 10 : 0;

    // Rank Math Score & Meta
    let rankMathScore = 55 + Math.floor(rand(3) * 42); // 55 to 97
    if (positionChange < -2.0) {
      rankMathScore = Math.max(40, rankMathScore - 15); // Drop correlated with lower RM score
    }

    const words = product.name.split(' ');
    const focusKeyword = words.slice(0, 3).join(' ');
    const seoTitle = `${product.name} | بررسی و خرید با بهترین قیمت`;
    const seoDescription =
      product.short_description?.replace(/<[^>]*>?/gm, '').trim() ||
      `خرید آنلاین ${product.name} با گارانتی اصالت، تضمین بهترین قیمت بازار و ارسال سریع به سراسر کشور. مشخصات کامل، نقد و بررسی و نظرات کاربران.`;

    // Index Status
    const indexRand = rand(4);
    let indexStatus: any = 'INDEXED';
    let lastCrawled = '۲ روز پیش';
    if (indexRand > 0.92) {
      indexStatus = 'CRAWLED_NOT_INDEXED';
      lastCrawled = '۵ روز پیش';
    } else if (indexRand > 0.85) {
      indexStatus = 'NOT_INDEXED';
      lastCrawled = 'هنوز کراول نشده';
    }

    const needsContentUpdate = positionChange <= -1.5 || rankMathScore < 70 || indexStatus !== 'INDEXED';

    // Historical Trend Data points (4 checkpoints across 28 days)
    const trendHistory = [
      {
        date: '۲۸ روز پیش',
        position: Math.round(prevAvgPosition * 10) / 10,
        clicks: Math.round(prevClicks * 0.22),
        impressions: Math.round(prevImpressions * 0.22),
      },
      {
        date: '۲۱ روز پیش',
        position: Math.round((prevAvgPosition * 0.7 + avgPosition * 0.3) * 10) / 10,
        clicks: Math.round(prevClicks * 0.24),
        impressions: Math.round(prevImpressions * 0.24),
      },
      {
        date: '۱۴ روز پیش',
        position: Math.round((prevAvgPosition * 0.4 + avgPosition * 0.6) * 10) / 10,
        clicks: Math.round(totalClicks * 0.26),
        impressions: Math.round(totalImpressions * 0.26),
      },
      {
        date: '۷ روز اخیر',
        position: avgPosition,
        clicks: Math.round(totalClicks * 0.28),
        impressions: Math.round(totalImpressions * 0.28),
      },
    ];

    // GA4 Metrics
    const gaVisits = Math.round(totalClicks * (1.15 + rand(5) * 0.4));
    const gaUsers = Math.round(gaVisits * (0.82 + rand(6) * 0.12));
    const gaBounceRate = Math.round((30 + rand(7) * 45) * 10) / 10;
    const gaAvgSessionSeconds = Math.round(75 + rand(8) * 180);

    const defaultTasks: SeoActionTask[] = [];

    // Pre-seed tasks based on state
    if (positionChange <= -1.5) {
      defaultTasks.push({
        id: `task-${product.id}-1`,
        title: 'آپدیت جامع محتوا و اضافه کردن سوالات متداول سرچ کنسول',
        description: `رتبه این محصول از ${prevAvgPosition} به ${avgPosition} افت داشته است. با افزودن پاراگراف نقد و بررسی و پاسخ به کوئری "${queries[0]?.query || focusKeyword}" رتبه بازیابی خواهد شد.`,
        impact: 'high',
        category: 'content_update',
        status: 'pending',
        startDate: 'امروز',
        predictedFinishDate: '۳ روز دیگر',
        postCheckDate: '۲ هفته پس از انتشار',
        predictedRankImpact: `بهبود رتبه از ${avgPosition} به ${Math.max(1, avgPosition - 3)} (+۳ پله)`,
        suggestedContentPatch: {
          seoTitle: `${product.name} اصل + راهنمای جامع خرید و مقایسه قیمت`,
          focusKeyword,
          metaDescription: `راهنمای کامل خرید ${product.name} همراه با بررسی فنی، مقایسه قیمت روز و مشخصات به همراه نظرات واقعی خریداران.`,
          faqList: [
            {
              question: `آیا ${product.name} دارای گارانتی معتبر شرکتی است؟`,
              answer: `بله، تمامی مدل‌های ${product.name} عرضه شده در سایت دارای گارانتی معتبر و مهلت تست ۷ روزه اصالت کالا می‌باشند.`,
            },
            {
              question: `زمان ارسال ${product.name} چقدر است؟`,
              answer: `ارسال در تهران به صورت اکسپرس ۲ الی ۴ ساعته و برای سایر شهرستان‌ها با پست پیشتاز بین ۲۴ الی ۴۸ ساعت کاری تحویل داده می‌شود.`,
            },
          ],
        },
      });
    }

    if (ctr < 3.5 && totalImpressions > 800) {
      defaultTasks.push({
        id: `task-${product.id}-2`,
        title: 'بهینه‌سازی عنوان سئو و متا دیسکریپشن جهت افزایش CTR',
        description: 'ایمپرشن این صفحه بسیار بالاست ولی به دلیل عنوان معمولی، نرخ کلیک پایینی دارد. اضافه کردن ایموجی و عبارت ترغیب‌کننده CTR را دو برابر می‌کند.',
        impact: 'medium',
        category: 'meta_optimization',
        status: 'pending',
        startDate: 'فردا',
        predictedFinishDate: '۲ روز دیگر',
        postCheckDate: '۱۰ روز پس از تغییر',
        predictedRankImpact: 'افزایش CTR از ۳.۲٪ به ۷.۵٪ و رشد حداقل ۱۸۰ کلیک ماهانه',
      });
    }

    if (indexStatus !== 'INDEXED') {
      defaultTasks.push({
        id: `task-${product.id}-3`,
        title: 'ارسال درخواست ایندکس فوری (Request Indexing) در گوگل',
        description: 'این صفحه در وضعیت Crawled - Currently Not Indexed قرار دارد و نیاز به درخواست ایندکس مجدد دارد.',
        impact: 'high',
        category: 'technical_index',
        status: 'scheduled',
        startDate: 'هم‌اکنون',
        predictedFinishDate: 'امروز',
        postCheckDate: '۴۸ ساعت آینده',
        predictedRankImpact: 'ثبت در نتایج گوگل و دریافت کلیک اولیه',
      });
    }

    return {
      productId: product.id,
      productTitle: product.name,
      productSlug: product.slug || `product-${product.id}`,
      pageUrl: `${cleanSite}/product/${product.slug || product.id}/`,
      productSku: product.sku || `SKU-${product.id}`,
      categoryName,
      price: product.price || product.regular_price,
      featuredImage: product.images?.[0]?.src,

      clicks: totalClicks,
      previousClicks: prevClicks,
      clicksChangePercent,

      impressions: totalImpressions,
      previousImpressions: prevImpressions,
      impressionsChangePercent,

      ctr,
      previousCtr,

      averagePosition: avgPosition,
      previousAveragePosition: prevAvgPosition,
      positionChange,

      gaVisits,
      gaUsers,
      gaBounceRate,
      gaAvgSessionSeconds,
      gaTopTrafficSources: [
        { source: 'Google Organic Search', percentage: 76 },
        { source: 'Direct / مستقیم', percentage: 14 },
        { source: 'Social Media / شبکه‌های اجتماعی', percentage: 7 },
        { source: 'Referral / ارجاعی', percentage: 3 },
      ],
      gaTopCountries: [
        { country: 'ایران', flag: '🇮🇷', visits: Math.round(gaVisits * 0.94) },
        { country: 'آلمان', flag: '🇩🇪', visits: Math.round(gaVisits * 0.03) },
        { country: 'کانادا', flag: '🇨🇦', visits: Math.round(gaVisits * 0.02) },
        { country: 'سایر', flag: '🌍', visits: Math.round(gaVisits * 0.01) },
      ],

      rankMathScore,
      focusKeyword,
      seoTitle,
      seoDescription,
      schemaType: 'Product',
      indexStatus,
      lastCrawledDate: lastCrawled,
      lastIndexRequestedDate: undefined,
      hasCanonicalIssue: false,
      needsContentUpdate,

      trendHistory,
      queries,

      aiAnalysis: {
        statusSummary:
          positionChange > 1.5
            ? `این محصول رشد قابل توجهی داشته و رتبه میانگین آن ${Math.abs(positionChange)} پله بهبود یافته است.`
            : positionChange < -1.5
            ? `این محصول دچار افت رتبه (${Math.abs(positionChange)} پله) در نتایج جستجوی گوگل شده و نیازمند اقدام فوری است.`
            : `وضعیت رتبه این محصول باثبات است و با بهبود کلمات صفحه دوم امکان ورود به رتبه‌های برتر وجود دارد.`,
        healthStatus:
          indexStatus !== 'INDEXED'
            ? 'needs_index'
            : positionChange < -2.5
            ? 'severe_drop'
            : positionChange < -1.0
            ? 'at_risk_drop'
            : positionChange > 1.5
            ? 'growing'
            : rankMathScore > 85
            ? 'excellent'
            : 'stable',
        rootCause:
          positionChange < -1.5
            ? 'رقبا محتوای جامع‌تر و نقد و بررسی طولانی‌تری اضافه کرده‌اند و کلمات کلیدی جدید سرچ شده توسط کاربران در متن محصول موجود نیست.'
            : 'ترافیک طبیعی و کلمات کلیدی پایدار است.',
        contentUpdateReason: needsContentUpdate
          ? 'نیاز به آپدیت بخش سوالات متداول، مشخصات جدول و افزودن کلمات جستجو شده سرچ کنسول.'
          : undefined,
        tasks: defaultTasks,
        generatedAt: new Date().toISOString(),
      },
    };
  });
}

// Generate realistic Content Gap opportunities (Search queries with no matching product page)
export function generateContentGaps(products: WCProduct[]): ContentGapOpportunity[] {
  const categories = Array.from(
    new Set(products.map((p) => p.categories?.[0]?.name || 'تجهیزات الکترونیک'))
  );

  return [
    {
      id: 'gap-1',
      query: 'بهترین مارک پاوربانک وایرلس فست شارژ ۲۰۲۵',
      impressions: 14850,
      estimatedMonthlyClicks: 1250,
      currentBestRankingPage: null,
      currentPosition: null,
      opportunityScore: 96,
      categoryName: categories[0] || 'لوازم جانبی',
      suggestedAction: 'create_product',
      aiProposedProduct: {
        name: 'پاوربانک بی سیم مگ سیف ۲۰۰۰۰ میلی آمپر فست شارژ ۲۰۲۵',
        regular_price: '۱۸۵۰۰۰۰',
        short_description: 'پاوربانک هوشمند بی سیم با توان خروجی ۳۰ وات و قابلیت شارژ همزمان ۳ دستگاه.',
        description:
          '<h2>بررسی پاوربانک وایرلس فست شارژ نسل جدید</h2><p>اگر به دنبال خرید بهترین پاوربانک وایرلس فست شارژ با پشتیبانی از فناوری مگ‌سیف و پاوردلیوری هستید، این مدل با ظرفیت واقعی ۲۰۰۰۰ میلی‌آمپر و بدنه ضدحرارت انتخابی ایده‌آل برای استفاده روزمره و سفر است.</p><h3>ویژگی‌های کلیدی:</h3><ul><li>خروجی وایرلس ۱۵ وات فوق سریع</li><li>درگاه Type-C دوطرفه با توان ۳۰ وات</li><li>نمایشگر دیجیتال دقیق درصد شارژ</li></ul>',
        focusKeyword: 'پاوربانک وایرلس فست شارژ',
        seoTitle: 'خرید پاوربانک بی سیم فست شارژ ۲۰۰۰۰ اصل | گارانتی اصالت',
        metaDescription: 'خرید جدیدترین پاوربانک وایرلس فست شارژ ۲۰۰۰۰ با ارسال فوری، گارانتی ۲۴ ماهه و قابلیت شارژ سریع تمامی گوشی‌های آیفون و سامسونگ.',
        faqList: [
          {
            question: 'آیا این پاوربانک قابلیت شارژ وایرلس آیفون را دارد؟',
            answer: 'بله، به طور کامل از مگ‌سیف آیفون ۱۲ تا ۱۶ و تمامی گوشی‌های دارای شارژ بی سیم پشتیبانی می‌کند.',
          },
        ],
      },
    },
    {
      id: 'gap-2',
      query: 'هندزفری بلوتوثی نویز کنسلینگ ضد آب با میکروفون قوی',
      impressions: 11200,
      estimatedMonthlyClicks: 890,
      currentBestRankingPage: null,
      currentPosition: null,
      opportunityScore: 92,
      categoryName: categories[1] || 'هدفون و صوتی',
      suggestedAction: 'create_product',
      aiProposedProduct: {
        name: 'ایرپاد پرو ضد آب نویز کنسلینگ فعال ANC با ۴ میکروفون گیمینگ',
        regular_price: '۲۴۵۰۰۰۰',
        short_description: 'هندزفری بلوتوثی نسل جدید با حذف نویز فعال، مقاومت کامل در برابر آب و باتری ۳۶ ساعته.',
        description:
          '<h2>راهنمای خرید هندزفری بلوتوثی نویز کنسلینگ قوی</h2><p>تجربه صدایی شفاف و بی‌نقص در مکالمه و موسیقی حتی در شلوغ‌ترین محیط‌ها با فناوری Active Noise Cancelling و درایورهای داینامیک تیتانیومی.</p>',
        focusKeyword: 'هندزفری بلوتوثی نویز کنسلینگ',
        seoTitle: 'خرید هندزفری بلوتوثی نویز کنسلینگ فعال ضد آب با قیمت روز',
        metaDescription: 'بهترین هندزفری بی سیم نویز کنسلینگ با میکروفون فوق‌العاده شفاف برای مکالمه، ضد آب IPX7 و نگهداری باتری فوق‌العاده.',
        faqList: [
          {
            question: 'آیا مناسب مکالمه در محیط‌های شلوغ و خیابان است؟',
            answer: 'بله، به لطف ۴ میکروفون مجهز به هوش مصنوعی ENC، نویز محیط تا ۹۵ درصد حذف می‌شود.',
          },
        ],
      },
    },
    {
      id: 'gap-3',
      query: 'کابل تبدیل چندکاره مگنتی تایپ سی به لایتنینگ و یو اس بی',
      impressions: 7600,
      estimatedMonthlyClicks: 520,
      currentBestRankingPage: null,
      currentPosition: null,
      opportunityScore: 84,
      categoryName: categories[0] || 'کابل و شارژر',
      suggestedAction: 'create_product',
      aiProposedProduct: {
        name: 'کابل تبدیل همه‌کاره ۶۰ وات مگنتی ۶ در ۱ فلزی',
        regular_price: '۴۸۰۰۰۰',
        short_description: 'کابل فست شارژ ۶۰ وات مجهز به تبدیل‌های Lightning، Type-C و Micro USB.',
        description: 'کابل شارژ و انتقال داده فوق سریع با روکش کنفی مقاوم در برابر کشش و پارگی.',
        focusKeyword: 'کابل تبدیل چندکاره مگنتی',
        seoTitle: 'خرید کابل تبدیل چندکاره مگنتی ۶۰ وات ۶ در ۱',
        metaDescription: 'کابل تبدیل چندکاره با سری‌های مگنتی قابل تعویض مناسب برای تمامی مدل‌های گوشی، تبلت و لپ‌تاپ.',
        faqList: [],
      },
    },
  ];
}

// Generate realistic Cannibalization Issues
export function generateCannibalizationIssues(insights: PageSeoInsight[]): CannibalizationIssue[] {
  if (insights.length < 2) return [];

  const p1 = insights[0];
  const p2 = insights[1];

  return [
    {
      id: 'cannibal-1',
      query: 'خرید و قیمت بهترین مدل در بازار',
      totalImpressions: 9400,
      competingPages: [
        {
          productId: p1.productId,
          title: p1.productTitle,
          url: p1.pageUrl,
          position: 6.4,
          clicks: 310,
          ctr: 4.8,
        },
        {
          productId: p2.productId,
          title: p2.productTitle,
          url: p2.pageUrl,
          position: 8.9,
          clicks: 140,
          ctr: 2.1,
        },
      ],
      aiDiagnosis:
        'هر دو محصول فوق با کلمه کلیدی یکسان در نتایج گوگل رقابت دارند که باعث شکسته شدن اعتبار سئو و نوسان رتبه هر دو در صفحه اول شده است.',
      recommendedAction: `تمرکز کلمه کلیدی اصلی روی محصول "${p1.productTitle}" و تغییر کلمه کلیدی محصول دوم به نسخه تخصصی‌تر، یا افزودن لینک داخلی از محصول دوم به اول.`,
    },
  ];
}
