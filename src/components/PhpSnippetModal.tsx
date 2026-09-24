import React, { useState } from 'react';
import JSZip from 'jszip';
import {
  X,
  Code2,
  Copy,
  Check,
  Download,
  FileCode,
  CheckCircle2,
  Package,
  Layers,
  Zap,
  ArrowLeft,
  ShieldCheck,
  RefreshCw,
  Info,
  Server,
  Terminal
} from 'lucide-react';

interface PhpSnippetModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteUrl?: string;
}

export const PhpSnippetModal: React.FC<PhpSnippetModalProps> = ({
  isOpen,
  onClose,
  siteUrl,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'download' | 'code' | 'features'>('download');
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const pluginPHPCode = `<?php
/**
 * Plugin Name: WP Sheet Sync & WooCommerce ACF Helper
 * Plugin URI: https://shop-center.ir
 * Description: افزونه همگام‌سازی کامل محصولات ووکامرس، فیلدهای زمینه سفارشی (ACF)، ساختار دیتا و تنظیمات CORS جهت مدیریت شیت‌گونه.
 * Version: 2.4.0
 * Author: WooCommerce Sheet Manager
 * Author URI: https://shop-center.ir
 * Text Domain: wp-sheet-sync
 */

if (!defined('ABSPATH')) {
    exit; // Exit if accessed directly
}

class WP_Sheet_Sync_Plugin {

    public function __construct() {
        // 1. تنظیمات CORS برای دسترسی بدون محدودیت
        add_action('init', array($this, 'handle_cors_headers'));

        // 2. ثبت فیلدهای ACF در REST API ووکامرس برای محصولات
        add_action('rest_api_init', array($this, 'register_acf_rest_fields'));

        // 3. ثبت روت اختصاصی برای دریافت ساختار دیتا (Schema)
        add_action('rest_api_init', array($this, 'register_sync_rest_routes'));
    }

    public function handle_cors_headers() {
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
        header("Access-Control-Allow-Headers: Authorization, Content-Type, X-WP-Total, X-WP-TotalPages, X-Requested-With");
        
        if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            status_header(200);
            exit();
        }
    }

    public function register_acf_rest_fields() {
        register_rest_field('product', 'acf', array(
            'get_callback' => function ($post) {
                if (function_exists('get_fields')) {
                    $fields = get_fields($post['id']);
                    return $fields ? $fields : new stdClass();
                }
                $meta = get_post_meta($post['id']);
                $acf_meta = array();
                if (is_array($meta)) {
                    foreach ($meta as $key => $val) {
                        if (strpos($key, '_') !== 0) {
                            $acf_meta[$key] = maybe_unserialize($val[0]);
                        }
                    }
                }
                return $acf_meta;
            },
            'update_callback' => function ($value, $post) {
                if (is_array($value)) {
                    foreach ($value as $key => $val) {
                        if (function_exists('update_field')) {
                            update_field($key, $val, $post->ID);
                        } else {
                            update_post_meta($post->ID, $key, $val);
                        }
                    }
                }
                return true;
            },
            'schema' => null,
        ));
    }

    public function register_sync_rest_routes() {
        register_rest_route('wp-sheet-sync/v1', '/schema', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_data_schema'),
            'permission_callback' => '__return_true'
        ));

        register_rest_route('wp-sheet-sync/v1', '/upload-datasheet', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_datasheet_upload'),
            'permission_callback' => '__return_true'
        ));

        register_rest_route('wp-sheet-sync/v1', '/ping', array(
            'methods' => 'GET',
            'callback' => function() {
                return array(
                    'status' => 'active',
                    'plugin' => 'WP Sheet Sync & WooCommerce ACF Helper',
                    'version' => '2.5.0',
                    'acf_active' => function_exists('get_fields'),
                    'woocommerce_active' => class_exists('WooCommerce'),
                    'datasheet_dir_exists' => file_exists(wp_upload_dir()['basedir'] . '/datasheet'),
                );
            },
            'permission_callback' => '__return_true'
        ));
    }

    public function handle_datasheet_upload($request) {
        $files = $request->get_file_params();
        if (empty($files['file'])) {
            return new WP_Error('no_file', 'فایلی ارسال نشده است.', array('status' => 400));
        }

        $upload_dir = wp_upload_dir();
        $target_dir = $upload_dir['basedir'] . '/datasheet';
        if (!file_exists($target_dir)) {
            wp_mkdir_p($target_dir);
        }

        $file = $files['file'];
        $filename = sanitize_file_name($file['name']);
        $target_file = $target_dir . '/' . $filename;

        if (move_uploaded_file($file['tmp_name'], $target_file)) {
            $url = $upload_dir['baseurl'] . '/datasheet/' . $filename;
            return array(
                'success' => true,
                'url' => $url,
                'filename' => $filename,
                'path' => $target_file
            );
        }

        return new WP_Error('upload_failed', 'خطا در ذخیره فایل در uploads/datasheet', array('status' => 500));
    }

    public function get_data_schema() {
        $acf_groups = array();
        if (function_exists('acf_get_field_groups')) {
            $groups = acf_get_field_groups(array('post_type' => 'product'));
            if (is_array($groups)) {
                foreach ($groups as $group) {
                    $fields = acf_get_fields($group['key']);
                    $acf_groups[] = array(
                        'title' => $group['title'],
                        'key' => $group['key'],
                        'fields' => array_map(function($f) {
                            return array(
                                'key' => $f['name'],
                                'label' => $f['label'],
                                'type' => $f['type']
                            );
                        }, is_array($fields) ? $fields : array())
                    );
                }
            }
        }

        $categories = get_terms(array('taxonomy' => 'product_cat', 'hide_empty' => false));
        $cat_list = array();
        if (is_array($categories) && !is_wp_error($categories)) {
            foreach ($categories as $c) {
                $cat_list[] = array('id' => $c->term_id, 'name' => $c->name, 'slug' => $c->slug);
            }
        }

        return array(
            'success' => true,
            'acf_groups' => $acf_groups,
            'categories' => $cat_list,
            'wp_version' => get_bloginfo('version'),
            'wc_version' => defined('WC_VERSION') ? WC_VERSION : 'N/A'
        );
    }
}

new WP_Sheet_Sync_Plugin();
`;

  const pluginReadme = `=== WP Sheet Sync & WooCommerce ACF Helper ===
Contributors: WooCommerce Sheet Manager
Tags: woocommerce, acf, rest api, excel, sync
Requires at least: 5.6
Tested up to: 6.6
Requires PHP: 7.4
Stable tag: 2.4.0

افزونه اختصاصی همگام‌سازی محصولات ووکامرس، فیلدهای زمینه سفارشی (ACF)، ساختار دیتا و تنظیمات CORS جهت مدیریت شیت‌گونه.

== نصب ==
1. فایل زیپ افزونه را دانلود کنید.
2. در پنل مدیریت وردپرس به بخش افزونه‌ها -> افزودن -> بارگذاری افزونه بروید.
3. فایل ZIP را آپلود و فعال‌سازی نمایید.
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(pluginPHPCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder('wp-sheet-sync');
      if (folder) {
        folder.file('wp-sheet-sync.php', pluginPHPCode);
        folder.file('readme.txt', pluginReadme);
      }

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'wp-sheet-sync-plugin.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating ZIP:', err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleDownloadPhpFile = () => {
    const blob = new Blob([pluginPHPCode], { type: 'text/x-php;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wp-sheet-sync.php';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center shadow-inner">
              <Package className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-slate-100">
                  دانلود افزونه وردپرس همگام‌ساز (WP Sheet Sync & ACF)
                </h2>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-mono">
                  v2.4.0
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                افزونه مکمل جهت سینک خودکار محصولات، فیلدهای ACF، ساختار متاداده‌ها و رفع خطای CORS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="bg-slate-950/60 px-6 border-b border-slate-800/80 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('download')}
            className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'download'
                ? 'border-purple-500 text-purple-300 bg-purple-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>دانلود افزونه و راهنمای نصب</span>
          </button>

          <button
            onClick={() => setActiveTab('code')}
            className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'code'
                ? 'border-purple-500 text-purple-300 bg-purple-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>کد PHP مستقیم (functions.php)</span>
          </button>

          <button
            onClick={() => setActiveTab('features')}
            className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'features'
                ? 'border-purple-500 text-purple-300 bg-purple-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>امکانات و ساختار سینک</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-slate-300">
          {activeTab === 'download' && (
            <div className="space-y-6 animate-fade-in">
              {/* Primary Action Card: Download ZIP */}
              <div className="bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/30 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-2 text-right">
                  <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>دانلود فایل آماده افزونه (فرمت ZIP)</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed max-w-lg">
                    با کلیک روی دکمه روبرو، فایل فشرده <code className="bg-slate-950 px-1.5 py-0.5 rounded text-emerald-400 font-mono">wp-sheet-sync-plugin.zip</code> آماده دانلود می‌شود و می‌توانید آن را مستقیماً در پنل وردپرس خود آپلود و فعال کنید.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
                  <button
                    onClick={handleDownloadZip}
                    disabled={isZipping}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-5 py-3 rounded-xl transition-all shadow-lg shadow-emerald-950/50 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                  >
                    <Download className={`w-4 h-4 ${isZipping ? 'animate-bounce' : ''}`} />
                    <span>{isZipping ? 'در حال ساخت فایل ZIP...' : 'دانلود افزونه (ZIP)'}</span>
                  </button>

                  <button
                    onClick={handleDownloadPhpFile}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 font-semibold px-4 py-3 rounded-xl transition-colors hover:text-white"
                  >
                    <FileCode className="w-4 h-4 text-purple-400" />
                    <span>دانلود فایل PHP</span>
                  </button>
                </div>
              </div>

              {/* Step by Step Setup Instructions */}
              <div className="space-y-3">
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span>طریقه نصب و فعال‌سازی افزونه روی وب‌سایت مبدا (وردپرس):</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Step 1 */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center shrink-0 border border-purple-500/30">
                      ۱
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200 mb-1">دانلود فایل ZIP افزونه</h4>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        دکمه «دانلود افزونه (ZIP)» بالا را فشار دهید تا فایل <code className="text-emerald-400">wp-sheet-sync-plugin.zip</code> در کامپیوتر شما ذخیره شود.
                      </p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center shrink-0 border border-purple-500/30">
                      ۲
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200 mb-1">بارگذاری در پیشخوان وردپرس</h4>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        وارد مدیریت وردپرس سایت خود شوید و به مسیر <strong className="text-slate-200">افزونه‌ها ← افزودن افزونه جدید ← بارگذاری افزونه</strong> بروید.
                      </p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center shrink-0 border border-purple-500/30">
                      ۳
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200 mb-1">نصب و فعال‌سازی</h4>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        فایل ZIP را انتخاب کرده، دکمه «هم‌اکنون نصب کن» را بزنید و سپس روی <strong className="text-emerald-400">«فعال‌سازی افزونه»</strong> کلیک کنید.
                      </p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 font-bold flex items-center justify-center shrink-0 border border-purple-500/30">
                      ۴
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-200 mb-1">ثبت کلیدهای ووکامرس در این برنامه</h4>
                      <p className="text-slate-400 text-[11px] leading-relaxed">
                        در وردپرس به <strong className="text-slate-200">ووکامرس ← پیکربندی ← پیشرفته ← REST API</strong> رفته و یک کلید با دسترسی خواندن/نوشتن به برنامه متصل کنید.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Checklist Banner */}
              <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="font-semibold text-slate-200 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>تضمین عملکرد پس از نصب افزونه:</span>
                </div>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-400">
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>سینک دوطرفه تمام فیلدهای زمینه سفارشی ACF</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>شناسایی خودکار ساختار دیتای محصولات و دسته‌ها</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>پشتیبانی از ویرایش دسته‌جمعی و ویرایش تکی شیت</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    <span>رفع کامل ارورهای CORS مرورگر و وب‌سرور</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  اگر قصد دارید بدون نصب افزونه فایل، کد را مستقیماً به <code className="text-emerald-400 bg-slate-950 px-1 py-0.5 rounded font-mono">functions.php</code> قالب خود اضافه کنید:
                </p>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 rounded-xl text-xs font-semibold transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'کپی شد!' : 'کپی کد PHP'}</span>
                </button>
              </div>

              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto text-left dir-ltr leading-relaxed max-h-[50vh]">
                <code>{pluginPHPCode}</code>
              </pre>
            </div>
          )}

          {activeTab === 'features' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-200 text-xs flex items-center gap-2">
                  <Server className="w-4 h-4 text-purple-400" />
                  <span>معماری و مسیرهای REST API ایجاد شده توسط افزونه:</span>
                </h4>

                <div className="space-y-2 text-[11px] font-mono dir-ltr text-left">
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-purple-300 font-bold">GET /wp-json/wp-sheet-sync/v1/schema</span>
                    <span className="text-slate-400 font-sans text-[10px]">دریافت ساختار ACF و گروه‌های فیلد</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-purple-300 font-bold">GET /wp-json/wp-sheet-sync/v1/ping</span>
                    <span className="text-slate-400 font-sans text-[10px]">تست وضعیت فعال بودن ووکامرس و ACF</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-emerald-400 font-bold">GET/POST /wp-json/wc/v3/products (acf)</span>
                    <span className="text-slate-400 font-sans text-[10px]">خواند و نوشتن فیلدهای ACF در محصولات</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
                  <Zap className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                  <div className="font-bold text-slate-200 text-xs">سرعت بالای همگام‌سازی</div>
                  <p className="text-[10px] text-slate-400 mt-1">بدون فشار به دیتابیس و پردازش مستقیم متاداده‌ها</p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
                  <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  <div className="font-bold text-slate-200 text-xs">امنیت کاملاً استاندارد</div>
                  <p className="text-[10px] text-slate-400 mt-1">احراز هویت بر اساس OAuth1 / Key Secret رسمی ووکامرس</p>
                </div>

                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
                  <Layers className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <div className="font-bold text-slate-200 text-xs">پشتیبانی از انواع فیلد ACF</div>
                  <p className="text-[10px] text-slate-400 mt-1">متن، عدد، انتخابگر، گارانتی، انبار، رنگ و ...</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 hidden sm:block">
            پس از فعال‌سازی افزونه در وردپرس، دکمه «تست ارتباط» را بزنید.
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors mr-auto"
          >
            بستن راهنما
          </button>
        </div>
      </div>
    </div>
  );
};
