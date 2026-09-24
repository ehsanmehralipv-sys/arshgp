import React, { useState, useEffect } from 'react';
import {
  Calendar,
  HardDrive,
  Mail,
  RefreshCw,
  Plus,
  Trash2,
  ExternalLink,
  Send,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  User,
  Search,
  UploadCloud,
  FileSpreadsheet,
  Inbox,
  Sparkles,
} from 'lucide-react';
import {
  GoogleCalendarEvent,
  GoogleDriveFile,
  GmailMessageSummary,
  fetchCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
  fetchDriveFiles,
  createDriveFile,
  deleteDriveFile,
  fetchGmailMessages,
  sendGmailMessage,
} from '../../services/googleWorkspaceService';
import { googleSignIn, logoutGoogle, initAuth, getAccessToken } from '../../services/googleAuth';
import { WCProduct } from '../../types';

interface GoogleWorkspaceHubProps {
  products: WCProduct[];
  showToast: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const GoogleWorkspaceHub: React.FC<GoogleWorkspaceHubProps> = ({ products, showToast }) => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'drive' | 'gmail'>('calendar');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Calendar State
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isCreateEventModalOpen, setIsCreateEventModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventTime, setNewEventTime] = useState('10:00');
  const [newEventDesc, setNewEventDesc] = useState('');

  // Drive State
  const [files, setFiles] = useState<GoogleDriveFile[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isExportingToDrive, setIsExportingToDrive] = useState(false);

  // Gmail State
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [isLoadingGmail, setIsLoadingGmail] = useState(false);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Confirmation Modal for Destructive Workspace Operations
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: async () => {},
  });

  // Auth initialization
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setIsAuthenticated(true);
        setIsLoadingAuth(false);
      },
      () => {
        setCurrentUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Load data based on active tab
  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'calendar') loadCalendar();
      if (activeTab === 'drive') loadDrive();
      if (activeTab === 'gmail') loadGmail();
    }
  }, [activeTab, isAuthenticated]);

  const handleSignIn = async () => {
    try {
      setIsLoadingAuth(true);
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setIsAuthenticated(true);
        showToast('success', `با موفقیت وارد حساب گوگل شدید: ${res.user.email}`);
      }
    } catch (err: any) {
      showToast('error', `خطا در ورود به حساب گوگل: ${err.message}`);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutGoogle();
      setIsAuthenticated(false);
      setCurrentUser(null);
      setEvents([]);
      setFiles([]);
      setMessages([]);
      showToast('info', 'از حساب گوگل خارج شدید.');
    } catch (err: any) {
      showToast('error', `خطا در خروج: ${err.message}`);
    }
  };

  // Calendar Actions
  const loadCalendar = async () => {
    setIsLoadingEvents(true);
    try {
      const data = await fetchCalendarEvents(20);
      setEvents(data);
    } catch (err: any) {
      showToast('error', `دریافت تقویم: ${err.message}`);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !newEventDate) {
      showToast('error', 'عنوان و تاریخ الزامی است.');
      return;
    }

    try {
      const startDateTime = new Date(`${newEventDate}T${newEventTime || '09:00'}:00`).toISOString();
      const endDateTime = new Date(new Date(startDateTime).getTime() + 60 * 60 * 1000).toISOString();

      await createCalendarEvent({
        summary: newEventTitle,
        description: newEventDesc,
        start: { dateTime: startDateTime },
        end: { dateTime: endDateTime },
      });

      showToast('success', 'رویداد با موفقیت در گوگل کلندر ثبت شد.');
      setIsCreateEventModalOpen(false);
      setNewEventTitle('');
      setNewEventDesc('');
      loadCalendar();
    } catch (err: any) {
      showToast('error', `خطا در ثبت رویداد: ${err.message}`);
    }
  };

  const promptDeleteEvent = (event: GoogleCalendarEvent) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف رویداد از تقویم گوگل',
      description: `آیا از حذف رویداد «${event.summary}» از گوگل کلندر اطمینان دارید؟`,
      onConfirm: async () => {
        if (!event.id) return;
        await deleteCalendarEvent(event.id);
        showToast('success', 'رویداد از تقویم حذف شد.');
        loadCalendar();
      },
    });
  };

  // Drive Actions
  const loadDrive = async () => {
    setIsLoadingFiles(true);
    try {
      const data = await fetchDriveFiles(25);
      setFiles(data);
    } catch (err: any) {
      showToast('error', `دریافت فایل‌ها: ${err.message}`);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleExportProductsToDrive = async () => {
    if (products.length === 0) {
      showToast('error', 'هیچ محصولی برای خروجی گرفتن وجود ندارد.');
      return;
    }

    setIsExportingToDrive(true);
    try {
      const header = 'ID,Name,SKU,Price,Regular Price,Stock,Categories\n';
      const rows = products
        .map(
          (p) =>
            `"${p.id}","${p.name.replace(/"/g, '""')}","${p.sku || ''}","${p.price || ''}","${
              p.regular_price || ''
            }","${p.stock_quantity ?? ''}","${(p.categories || []).map((c) => c.name).join(' > ')}"`
        )
        .join('\n');

      const csvContent = '\uFEFF' + header + rows;
      const fileName = `محصولات_ووکامرس_${new Date().toISOString().split('T')[0]}.csv`;

      const created = await createDriveFile(fileName, csvContent, 'text/csv');
      showToast('success', `فایل «${created.name}» با موفقیت در گوگل درایو شما ذخیره شد.`);
      loadDrive();
    } catch (err: any) {
      showToast('error', `خطا در ذخیره فایل در گوگل درایو: ${err.message}`);
    } finally {
      setIsExportingToDrive(false);
    }
  };

  const promptDeleteDriveFile = (file: GoogleDriveFile) => {
    setConfirmModal({
      isOpen: true,
      title: 'حذف فایل از گوگل درایو',
      description: `آیا از حذف دائمی فایل «${file.name}» از Google Drive اطمینان دارید؟`,
      onConfirm: async () => {
        await deleteDriveFile(file.id);
        showToast('success', 'فایل از درایو حذف شد.');
        loadDrive();
      },
    });
  };

  // Gmail Actions
  const loadGmail = async () => {
    setIsLoadingGmail(true);
    try {
      const data = await fetchGmailMessages(15);
      setMessages(data);
    } catch (err: any) {
      showToast('error', `دریافت ایمیل‌ها: ${err.message}`);
    } finally {
      setIsLoadingGmail(false);
    }
  };

  const promptSendEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTo.trim() || !emailSubject.trim() || !emailBody.trim()) {
      showToast('error', 'لطفاً گیرنده، موضوع و متن ایمیل را کامل کنید.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'ارسال ایمیل رسمی از جیمیل شما',
      description: `آیا مایل به ارسال این ایمیل به آدرس «${emailTo}» با موضوع «${emailSubject}» هستید؟`,
      onConfirm: async () => {
        setIsSendingEmail(true);
        try {
          await sendGmailMessage(emailTo.trim(), emailSubject.trim(), emailBody.trim());
          showToast('success', 'ایمیل با موفقیت از طریق حساب جیمیل شما ارسال شد.');
          setIsComposeOpen(false);
          setEmailTo('');
          setEmailSubject('');
          setEmailBody('');
        } catch (err: any) {
          showToast('error', `خطا در ارسال ایمیل: ${err.message}`);
        } finally {
          setIsSendingEmail(false);
        }
      },
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0d0f14] overflow-y-auto p-4 sm:p-6 space-y-6 dir-rtl select-none">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-red-500 to-amber-500 flex items-center justify-center text-white shadow-lg">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              مدیریت یکپارچه گوگل ورک‌اسپیس (Google Workspace Hub)
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              اتصال مستقیم به Google Calendar، Google Drive و Gmail با احراز هویت رسمی گوگل
            </p>
          </div>
        </div>

        {/* Auth / Account status */}
        <div className="flex items-center gap-3">
          {isAuthenticated && currentUser ? (
            <div className="flex items-center gap-2.5 bg-slate-900 border border-slate-700/80 px-3 py-1.5 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                {currentUser.displayName ? currentUser.displayName.charAt(0) : 'G'}
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-white">{currentUser.displayName || 'کاربر گوگل'}</div>
                <div className="text-[10px] text-slate-400 font-mono">{currentUser.email}</div>
              </div>
              <button
                onClick={handleSignOut}
                className="mr-2 text-[11px] text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
              >
                خروج
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={isLoadingAuth}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isLoadingAuth ? 'در حال اتصال...' : 'ورود با حساب گوگل (Sign in with Google)'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'calendar'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
              : 'text-slate-400 hover:text-white bg-slate-900/50'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Google Calendar (تقویم و تسک‌ها)</span>
        </button>

        <button
          onClick={() => setActiveTab('drive')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'drive'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
              : 'text-slate-400 hover:text-white bg-slate-900/50'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Google Drive (پشتیبان‌گیری و فایل‌ها)</span>
        </button>

        <button
          onClick={() => setActiveTab('gmail')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'gmail'
              ? 'bg-red-600 text-white shadow-md shadow-red-900/30'
              : 'text-slate-400 hover:text-white bg-slate-900/50'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Gmail (صندوق و ارسال ایمیل)</span>
        </button>
      </div>

      {/* Not Logged In State */}
      {!isAuthenticated && (
        <div className="bg-[#141720] border border-slate-800 rounded-2xl p-8 text-center max-w-lg mx-auto my-8 space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto">
            <Sparkles className="w-7 h-7" />
          </div>
          <h2 className="text-base font-bold text-white">اتصال به خدمات Google Workspace</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            برای مشاهده تقویم، مدیریت فایل‌های گوگل درایو و ارسال ایمیل با جیمیل، لطفاً با حساب گوگل خود وارد شوید.
          </p>
          <button
            onClick={handleSignIn}
            className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer transition-all flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4" />
            <span>ورود و احراز هویت با Google</span>
          </button>
        </div>
      )}

      {/* Authenticated Workspace Views */}
      {isAuthenticated && (
        <>
          {/* TAB 1: CALENDAR */}
          {activeTab === 'calendar' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-400" />
                    رویدادها و برنامه‌های کاری تقویم گوگل
                  </h3>
                  <span className="text-xs text-slate-400">({events.length} رویداد آینده)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={loadCalendar}
                    disabled={isLoadingEvents}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                    title="بروزرسانی تقویم"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEvents ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setIsCreateEventModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن رویداد جدید به تقویم</span>
                  </button>
                </div>
              </div>

              {isLoadingEvents ? (
                <div className="text-center py-12 text-slate-400 text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                  <span>در حال دریافت اطلاعات از Google Calendar...</span>
                </div>
              ) : events.length === 0 ? (
                <div className="bg-[#141720] border border-slate-800/80 rounded-xl p-8 text-center text-slate-400 text-xs">
                  هیچ رویدادی برای روزهای آینده در تقویم شما ثبت نشده است.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {events.map((evt, idx) => {
                    const startStr = evt.start?.dateTime || evt.start?.date || '';
                    const dateObj = startStr ? new Date(startStr) : null;
                    const dateFormatted = dateObj ? dateObj.toLocaleDateString('fa-IR') : 'نامشخص';
                    const timeFormatted = dateObj ? dateObj.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : '';

                    return (
                      <div
                        key={evt.id || idx}
                        className="bg-[#141720] border border-slate-800 hover:border-slate-700 p-4 rounded-xl space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-white text-xs leading-snug">{evt.summary}</span>
                            <button
                              onClick={() => promptDeleteEvent(evt)}
                              className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                              title="حذف رویداد"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {evt.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-2">{evt.description}</p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
                          <div className="flex items-center gap-1.5 text-blue-300">
                            <Clock className="w-3 h-3" />
                            <span>{dateFormatted} {timeFormatted && `- ${timeFormatted}`}</span>
                          </div>
                          {evt.htmlLink && (
                            <a
                              href={evt.htmlLink}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-400 hover:text-white flex items-center gap-0.5"
                            >
                              <span>مشاهده</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GOOGLE DRIVE */}
          {activeTab === 'drive' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-emerald-400" />
                    فایل‌ها و خروجی‌های Google Drive
                  </h3>
                  <span className="text-xs text-slate-400">({files.length} فایل اخیر)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={loadDrive}
                    disabled={isLoadingFiles}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                    title="بروزرسانی فایل‌ها"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={handleExportProductsToDrive}
                    disabled={isExportingToDrive}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{isExportingToDrive ? 'در حال آپلود در درایو...' : 'پشتیبان‌گیری و ذخیره اکسل در Google Drive'}</span>
                  </button>
                </div>
              </div>

              {isLoadingFiles ? (
                <div className="text-center py-12 text-slate-400 text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>در حال دریافت فایل‌ها از Google Drive...</span>
                </div>
              ) : files.length === 0 ? (
                <div className="bg-[#141720] border border-slate-800/80 rounded-xl p-8 text-center text-slate-400 text-xs">
                  فایلی در ریشه درایو یافت نشد.
                </div>
              ) : (
                <div className="bg-[#141720] border border-slate-800 rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-right">
                    <thead className="bg-[#11131a] text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="p-3">نام فایل</th>
                        <th className="p-3">نوع فرمت</th>
                        <th className="p-3">تاریخ آخرین تغییر</th>
                        <th className="p-3 text-center">عملیات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {files.map((file) => (
                        <tr key={file.id} className="hover:bg-slate-900/40 transition-colors">
                          <td className="p-3 font-medium text-white flex items-center gap-2">
                            <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="truncate max-w-xs">{file.name}</span>
                          </td>
                          <td className="p-3 text-slate-400 font-mono text-[11px] truncate max-w-[150px]">
                            {file.mimeType}
                          </td>
                          <td className="p-3 text-slate-400 font-mono text-[11px]">
                            {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString('fa-IR') : '-'}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {file.webViewLink && (
                                <a
                                  href={file.webViewLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1 text-slate-400 hover:text-white"
                                  title="باز کردن در گوگل درایو"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <button
                                onClick={() => promptDeleteDriveFile(file)}
                                className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                                title="حذف فایل از درایو"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GMAIL */}
          {activeTab === 'gmail' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-white flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-red-400" />
                    پیام‌ها و ایمیل‌های صندوق ورودی جیمیل
                  </h3>
                  <span className="text-xs text-slate-400">({messages.length} ایمیل اخیر)</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={loadGmail}
                    disabled={isLoadingGmail}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                    title="بروزرسانی جیمیل"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingGmail ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    onClick={() => setIsComposeOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>ارسال ایمیل جدید با جیمیل</span>
                  </button>
                </div>
              </div>

              {isLoadingGmail ? (
                <div className="text-center py-12 text-slate-400 text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-red-400" />
                  <span>در حال دریافت پیام‌ها از جیمیل...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="bg-[#141720] border border-slate-800/80 rounded-xl p-8 text-center text-slate-400 text-xs">
                  هیچ ایمیلی در اینباکس یافت نشد.
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`bg-[#141720] border rounded-xl p-3.5 space-y-1.5 transition-all ${
                        msg.unread
                          ? 'border-red-500/40 bg-red-950/10'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-white text-xs">{msg.from}</span>
                        <span className="text-[11px] text-slate-400 font-mono">{msg.date}</span>
                      </div>
                      <div className="text-xs font-semibold text-slate-200">{msg.subject}</div>
                      <p className="text-[11px] text-slate-400 line-clamp-1">{msg.snippet}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* CREATE CALENDAR EVENT MODAL */}
      {isCreateEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-[#161922] border border-slate-700 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <h3 className="font-bold text-sm text-white">افزودن رویداد جدید به تقویم گوگل</h3>
            <form onSubmit={handleCreateEvent} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">عنوان رویداد:</label>
                <input
                  type="text"
                  required
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="مثال: جلسه بررسی سئو و محصولات جدید"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">تاریخ:</label>
                  <input
                    type="date"
                    required
                    value={newEventDate}
                    onChange={(e) => setNewEventDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">ساعت:</label>
                  <input
                    type="time"
                    value={newEventTime}
                    onChange={(e) => setNewEventTime(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">توضیحات (اختیاری):</label>
                <textarea
                  rows={3}
                  value={newEventDesc}
                  onChange={(e) => setNewEventDesc(e.target.value)}
                  placeholder="توضیحات تکمیلی..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateEventModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-md cursor-pointer"
                >
                  ثبت رویداد در تقویم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPOSE EMAIL MODAL */}
      {isComposeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-[#161922] border border-slate-700 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-red-400" />
              ارسال ایمیل جدید با حساب جیمیل
            </h3>
            <form onSubmit={promptSendEmail} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">ایمیل گیرنده:</label>
                <input
                  type="email"
                  required
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  placeholder="example@gmail.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-red-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">موضوع ایمیل:</label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="موضوع نامه..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">متن ایمیل:</label>
                <textarea
                  rows={5}
                  required
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  placeholder="متن پیام خود را بنویسید..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl font-bold shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ارسال پیام</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR MUTATING / DESTRUCTIVE OPERATIONS */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-[#181a24] border border-slate-700 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">{confirmModal.title}</h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{confirmModal.description}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={async () => {
                  await confirmModal.onConfirm();
                  setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                تایید و انجام عملیات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
