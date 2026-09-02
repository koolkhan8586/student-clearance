import { useCallback, useEffect, useMemo, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import {
  apiPost,
  changePasswordRequest,
  exportAllRequest,
  fetchTableRequest,
  getClearanceRequest,
  getImportIndexRequest,
  getSettingsRequest,
  getSummaryRequest,
  loadMetaRequest,
  loginRequest,
  logoutRequest,
  lookupStudentRequest,
} from '../api/client';
import type {
  ClearanceReport,
  ImportPreview,
  Meta,
  SendPanel,
  SessionDetail,
  SettingsForm,
  SortConfig,
  SummaryRow,
  TableRow,
  UploadStatus,
  User,
} from '../types';
import { ADMIN_EXTRA_TABS, ITEMS_PER_PAGE, TAB_TABLES, TABS } from '../utils/constants';
import { norm, canonicalReg, parseDegreeFromReg, syncDegreeFromReg, num } from '../utils/format';

export function useFeeApp() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('clearance');
  const [isFetching, setIsFetching] = useState(false);

  const [meta, setMeta] = useState<Meta>({
    fees: [],
    banks: [],
    sessions: [],
    counts: {},
    users: [],
  });
  const [tableRows, setTableRows] = useState<TableRow[]>([]);
  const [tableTotal, setTableTotal] = useState(0);
  const [tableStats, setTableStats] = useState<Record<string, unknown> | null>(null);
  const [loanSemesterStats, setLoanSemesterStats] = useState<{ semester: string; total: number; count: number }[]>([]);
  const [summaryData, setSummaryData] = useState<SummaryRow[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [clearanceLoading, setClearanceLoading] = useState(false);

  const data = useMemo(
    () => ({
      fees: meta.fees || [],
      banks: meta.banks || [],
      users: meta.users || [],
      students: activeTab === 'students' ? tableRows : [],
      enrollments: activeTab === 'enrollments' ? tableRows : [],
      payments: activeTab === 'payments' || activeTab === 'loans' ? tableRows : [],
      discounts: activeTab === 'discounts' ? tableRows : [],
      others: activeTab === 'others' ? tableRows : [],
    }),
    [meta, tableRows, activeTab],
  );

  const [searchReg, setSearchReg] = useState('');
  const [filterSession, setFilterSession] = useState('');
  const [summaryFilterSession, setSummaryFilterSession] = useState('');
  const [tabSearch, setTabSearch] = useState('');
  const [debouncedTabSearch, setDebouncedTabSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string | number>>(new Set());
  const [clearanceResult, setClearanceResult] = useState<ClearanceReport | null>(null);

  const [currentPage, setCurrentPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });

  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [importPreview, setImportPreview] = useState<ImportPreview>({
    show: false,
    total: 0,
    newItems: [],
    duplicates: [],
    updates: [],
    type: '',
  });
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({ active: false, current: 0, total: 0 });
  const [importTerm, setImportTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionDetail, setSessionDetail] = useState<SessionDetail | null>(null);
  const [printOrientation, setPrintOrientation] = useState(
    () => localStorage.getItem('clearancePrintOrientation') || 'portrait',
  );
  const [loanDateFrom, setLoanDateFrom] = useState('');
  const [loanDateTo, setLoanDateTo] = useState('');
  const [settingsForm, setSettingsForm] = useState<SettingsForm | null>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [sendPanel, setSendPanel] = useState<SendPanel | null>(null);
  const [sendBusy, setSendBusy] = useState(false);

  const availableTabs = user
    ? user.role === 'admin'
      ? [...TABS, ...ADMIN_EXTRA_TABS]
      : TABS.filter((t) => (user.permissions || []).includes(t.id))
    : [];

  const loadMeta = useCallback(async () => {
    try {
      const res = await loadMetaRequest();
      if (res.status === 401) {
        setUser(null);
        sessionStorage.removeItem('feeUser');
        return false;
      }
      const json = await res.json();
      if (json.status === 'error') {
        alert(json.message || 'Failed to load data');
        return false;
      }
      setMeta({
        fees: Array.isArray(json.fees) ? json.fees : [],
        banks: Array.isArray(json.banks) ? json.banks : [],
        sessions: Array.isArray(json.sessions) ? json.sessions : [],
        counts: json.counts || {},
        users: Array.isArray(json.users) ? json.users : [],
      });
      return true;
    } catch (e) {
      console.error('Connection Error:', e);
      return false;
    }
  }, []);

  const loadTablePage = useCallback(
    async (
      tab = activeTab,
      page = currentPage,
      opts: {
        search?: string;
        sortKey?: string | null;
        sortDir?: string;
        dateFrom?: string;
        dateTo?: string;
      } = {},
    ) => {
      if (!TAB_TABLES.has(tab)) return;
      const search = opts.search ?? debouncedTabSearch;
      const sortKey = opts.sortKey ?? sortConfig.key;
      const sortDir = opts.sortDir ?? sortConfig.direction;
      const dateFrom = opts.dateFrom ?? loanDateFrom;
      const dateTo = opts.dateTo ?? loanDateTo;
      setIsFetching(true);
      try {
        const res = await fetchTableRequest({
          table: tab,
          page,
          limit: ITEMS_PER_PAGE,
          search,
          sortKey: sortKey || 'id',
          sortDir: sortDir || 'desc',
          dateFrom,
          dateTo,
        });
        if (res.status === 401) {
          setUser(null);
          sessionStorage.removeItem('feeUser');
          return;
        }
        const json = await res.json();
        if (json.status === 'success') {
          const rows = json.rows || [];
          setTableRows(tab === 'students' ? rows.map((row: TableRow) => syncDegreeFromReg(row)) : rows);
          setTableTotal(json.total || 0);
          setTableStats(json.stats || null);
          setLoanSemesterStats(json.loanSemesterStats || []);
        } else {
          alert(json.message || 'Failed to load records');
        }
      } catch (e) {
        console.error('Table load error:', e);
      } finally {
        setIsFetching(false);
      }
    },
    [activeTab, currentPage, debouncedTabSearch, sortConfig, loanDateFrom, loanDateTo],
  );

  const loadSummary = useCallback(async (filter = summaryFilterSession) => {
    setSummaryLoading(true);
    try {
      const res = await getSummaryRequest(filter);
      const json = await res.json();
      if (json.status === 'success') setSummaryData(json.summary || []);
      else alert(json.message || 'Failed to load summary');
    } catch {
      alert('Network Error');
    } finally {
      setSummaryLoading(false);
    }
  }, [summaryFilterSession]);

  const refreshData = useCallback(async () => {
    await loadMeta();
    if (activeTab === 'summary') await loadSummary();
    else if (TAB_TABLES.has(activeTab)) await loadTablePage(activeTab, currentPage);
  }, [activeTab, currentPage, loadMeta, loadSummary, loadTablePage]);

  useEffect(() => {
    let styleTag = document.getElementById('dynamic-print-orientation');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'dynamic-print-orientation';
      document.head.appendChild(styleTag);
    }
    styleTag.innerHTML = `@media print { @page { size: A4 ${printOrientation}; } }`;
    try {
      localStorage.setItem('clearancePrintOrientation', printOrientation);
    } catch (e) {
      console.warn('Could not save print orientation preference:', e);
    }
  }, [printOrientation]);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('feeUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as User;
        if (parsedUser && typeof parsedUser === 'object' && parsedUser.role && Array.isArray(parsedUser.permissions)) {
          setUser(parsedUser);
        } else {
          sessionStorage.removeItem('feeUser');
        }
      } catch {
        sessionStorage.removeItem('feeUser');
      }
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadMeta();
  }, [user, loadMeta]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedTabSearch(tabSearch), 350);
    return () => clearTimeout(timer);
  }, [tabSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedTabSearch, sortConfig, loanDateFrom, loanDateTo]);

  useEffect(() => {
    if (!user) return;
    if (activeTab === 'summary') loadSummary();
    else if (TAB_TABLES.has(activeTab)) loadTablePage(activeTab, currentPage);
  }, [user, activeTab, currentPage, debouncedTabSearch, sortConfig, loanDateFrom, loanDateTo, loadSummary, loadTablePage]);

  useEffect(() => {
    setSelectedIds(new Set());
    setTabSearch('');
    setSortConfig({ key: null, direction: 'asc' });
    setImportTerm('');
    setSidebarOpen(false);
    setCurrentPage(1);
    setLoanDateFrom('');
    setLoanDateTo('');
  }, [activeTab]);

  const loadSettings = useCallback(async () => {
    try {
      const res = await getSettingsRequest();
      const json = await res.json();
      if (json.status === 'success')
        setSettingsForm({
          ...(json.settings || {}),
          waha_api_key: '',
          smtp_password: '',
          brevo_api_key: '',
          google_service_account_json: '',
        });
      else alert(json.message || 'Failed to load settings');
    } catch {
      alert('Network Error');
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'settings' && user?.role === 'admin') loadSettings();
  }, [activeTab, user, loadSettings]);

  useEffect(() => {
    if (activeTab === 'summary' && user) loadSummary(summaryFilterSession);
  }, [summaryFilterSession, activeTab, user, loadSummary]);

  const generateReport = useCallback(async () => {
    const reg = canonicalReg(searchReg);
    if (!reg) return;
    setClearanceLoading(true);
    setClearanceResult(null);
    try {
      const res = await getClearanceRequest(reg, filterSession);
      const json = await res.json();
      if (json.status === 'success') {
        const returnedReg = canonicalReg(json.report?.student?.reg_no || '');
        if (returnedReg !== reg) {
          alert(`Wrong student returned. Searched ${reg} but got ${returnedReg}. Please upload the latest api.php to the server.`);
          setClearanceResult(null);
          return;
        }
        setClearanceResult(json.report);
      } else {
        alert(json.message || 'Student not found!');
        setClearanceResult(null);
      }
    } catch {
      alert('Network Error');
      setClearanceResult(null);
    } finally {
      setClearanceLoading(false);
    }
  }, [searchReg, filterSession]);

  useEffect(() => {
    if (activeTab === 'clearance' && searchReg && clearanceResult) {
      generateReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSession]);

  const filteredData = tableRows;
  const paginatedData = tableRows;
  const totalPages = Math.max(1, Math.ceil(tableTotal / ITEMS_PER_PAGE));
  const uniqueSessions = meta.sessions || [];

  const openSessionDetail = (sessionData: SummaryRow) => {
    setSessionDetail(sessionData);
  };

  const buildSessionDetailRows = (detail: SessionDetail) => {
    const headers = ['#', 'Reg No', 'Name', 'Courses', 'Cr', 'Tuition', 'Exam Fee', 'Discount', 'Total', 'Paid', 'Balance'];
    const rows = (detail.details || []).map((s, idx) => ({
      '#': idx + 1,
      'Reg No': s.reg_no || '',
      Name: s.name || '',
      Courses: s.courses || 0,
      Cr: s.cr || 0,
      Tuition: Math.round((s.tuition || 0) * 100) / 100,
      'Exam Fee': Math.round((s.exam || 0) * 100) / 100,
      Discount: Math.round((s.discount || 0) * 100) / 100,
      Total: Math.round(((s.tuition || 0) + (s.exam || 0) + (s.other || 0) - (s.discount || 0)) * 100) / 100,
      Paid: Math.round((s.paid || 0) * 100) / 100,
      Balance: Math.round((s.balance || 0) * 100) / 100,
    }));
    return { headers, rows };
  };

  const exportSessionDetailExcel = (detail: SessionDetail) => {
    if (!detail || !detail.details || detail.details.length === 0) return alert('No data to export');
    const { rows } = buildSessionDetailRows(detail);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    const safeName =
      String(detail.session || 'Session')
        .replace(/[\\/?*[\]:]/g, ' ')
        .substring(0, 28)
        .trim() || 'Session';
    XLSX.utils.book_append_sheet(wb, ws, safeName);
    const fileName = String(detail.session || 'session').replace(/[^a-z0-9]/gi, '_');
    XLSX.writeFile(wb, `Session_Detail_${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportSessionDetailCsv = (detail: SessionDetail) => {
    if (!detail || !detail.details || detail.details.length === 0) return alert('No data to export');
    const { headers, rows } = buildSessionDetailRows(detail);
    const escape = (v: unknown) => {
      const str = v === undefined || v === null ? '' : String(v);
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };
    const csvRows = [headers.join(',')];
    rows.forEach((r) => csvRows.push(headers.map((h) => escape(r[h as keyof typeof r])).join(',')));
    const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const fileName = String(detail.session || 'session').replace(/[^a-z0-9]/gi, '_');
    link.setAttribute('download', `Session_Detail_${fileName}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const paymentStats =
    activeTab === 'payments' && tableStats
      ? {
          total: parseFloat(String(tableStats.total || 0)),
          bank: parseFloat(String(tableStats.bank || 0)),
          cash: parseFloat(String(tableStats.cash || 0)),
        }
      : { total: 0, bank: 0, cash: 0 };

  const postToApi = useCallback(
    async (action: string, payload: Record<string, unknown> = {}, skipRefresh = false) => {
      try {
        const res = await apiPost(action, payload);
        if (res.status === 401) {
          setUser(null);
          sessionStorage.removeItem('feeUser');
          alert('Your session has expired. Please log in again.');
          return false;
        }
        const json = await res.json();
        if (json.status === 'success') {
          if (!skipRefresh) refreshData();
          return true;
        }
        alert('Error: ' + json.message);
        return false;
      } catch {
        alert('Network Error');
        return false;
      }
    },
    [refreshData],
  );

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSaving(true);
    const ok = await postToApi('save_settings', { data: settingsForm }, true);
    setSettingsSaving(false);
    if (ok) {
      alert('Settings saved.');
      loadSettings();
    }
  };

  const generateClearancePdfBase64 = async () => {
    const element = document.getElementById('printableArea');
    if (!element) throw new Error('Printable area not found');
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    const pdf = new jsPDF({
      orientation: printOrientation as 'portrait' | 'landscape',
      unit: 'mm',
      format: 'a4',
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    return pdf.output('datauristring').split(',')[1];
  };

  const sendClearance = async () => {
    if (!sendPanel || !clearanceResult) return;
    const { channel, recipient } = sendPanel;
    if (!recipient)
      return alert(`Enter ${channel === 'email' ? 'an email address' : 'a mobile number'} to send to.`);

    const s = clearanceResult.student;
    const payload: Record<string, unknown> = {
      channel,
      recipient,
      subject: `Fee Clearance Report - ${s.reg_no}`,
      student_name: s.name,
      reg_no: s.reg_no,
      degree: s.degree,
      batch: s.batch,
      scholarship: num(clearanceResult.summary.fa),
      net_payable: num(clearanceResult.summary.balance),
    };

    setSendBusy(true);
    if (channel === 'email') {
      try {
        payload.attachment = await generateClearancePdfBase64();
        payload.attachmentName = `Clearance_${s.reg_no}.pdf`;
      } catch (e) {
        setSendBusy(false);
        return alert('Could not generate the PDF attachment: ' + (e as Error).message);
      }
    }

    const ok = await postToApi('send_clearance', { data: payload }, true);
    setSendBusy(false);
    if (ok) {
      alert(`Sent via ${channel === 'email' ? 'Email' : 'WhatsApp'}.`);
      setSendPanel(null);
    }
  };

  const syncBrowserDataToDb = async () => {
    if (!confirm('Sync browser data to database?')) return;
    const local = localStorage.getItem('feeSystemData_v2') || localStorage.getItem('fee_system_local');
    if (!local) return alert('No local data found.');
    const localData = JSON.parse(local) as Record<string, TableRow[]>;
    const categories = ['students', 'fees', 'enrollments', 'payments', 'discounts', 'others', 'banks'];
    let count = 0;

    let totalToSync = 0;
    for (const cat of categories) {
      totalToSync += (localData[cat] || []).length;
    }
    if (totalToSync === 0) return alert('No data to sync.');

    setUploadStatus({ active: true, current: 0, total: totalToSync });

    const chunkSize = 25;
    for (const cat of categories) {
      const items = localData[cat] || [];
      let actionType = cat.endsWith('s') ? cat.slice(0, -1) : cat;
      if (cat === 'others') actionType = 'other';

      for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        await Promise.all(chunk.map((item) => postToApi(`save_${actionType}`, { data: item }, true)));
        count += chunk.length;
        setUploadStatus((prev) => ({ ...prev, current: count }));
      }
    }
    setUploadStatus({ active: false, current: 0, total: 0 });
    alert(`Sync Complete! Uploaded/Checked ${count} records.`);
    refreshData();
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await loginRequest(loginData.username, loginData.password);
      const json = await res.json();
      if (json.status === 'success' && json.user) {
        const found = json.user as User;
        setUser(found);
        sessionStorage.setItem('feeUser', JSON.stringify(found));
        setLoginData({ username: '', password: '' });
        const foundPerms = found.permissions || [];
        if (found.role === 'admin' || foundPerms.includes('clearance')) setActiveTab('clearance');
        else if (foundPerms.length > 0) setActiveTab(foundPerms[0]);
        refreshData();
      } else {
        alert(json.message || 'Invalid Credentials');
      }
    } catch {
      alert('Network Error');
    }
  };

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch {
      /* ignore */
    }
    setUser(null);
    sessionStorage.removeItem('feeUser');
    setClearanceResult(null);
    setActiveTab('clearance');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.new !== passwordData.confirm) return alert('New passwords do not match!');
    try {
      const res = await changePasswordRequest(passwordData.current, passwordData.new);
      const json = await res.json();
      if (json.status === 'success') {
        alert('Password changed successfully!');
        setShowPasswordModal(false);
        setPasswordData({ current: '', new: '', confirm: '' });
      } else {
        alert(json.message || 'Failed to change password');
      }
    } catch {
      alert('Network Error');
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const handleDelete = async (type: string, id: string | number) => {
    if (type === 'payments') {
      const target = tableRows.find((p) => p.id === id);
      if (target && norm(target.bank) === 'loan') {
        alert('This is a loan-sourced payment. Delete it from the "Other Bank" tab instead.');
        return;
      }
    }

    if (!confirm('Are you sure?')) return;

    const actionName = type === 'loans' ? 'payment' : type;
    const ok = await postToApi(`delete_${actionName}`, { id }, true);
    if (ok) {
      setTableRows((prev) => prev.filter((item) => (type === 'students' ? item.reg_no !== id : item.id !== id)));
      setTableTotal((prev) => Math.max(0, prev - 1));
      loadMeta();
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const newData = { ...formData };
    if (modalType === 'fees') {
      const cr = parseFloat(String(newData.cr || 0));
      const rate = parseFloat(String(newData.per_cr_fee || 0));
      const courses = parseFloat(String(newData.total_courses || 0));
      const examRate = parseFloat(String(newData.per_course_fee || 0));
      newData.tuition_fee = cr * rate;
      newData.exam_fee = courses * examRate;
      newData.total_fee =
        Number(newData.tuition_fee) +
        Number(newData.exam_fee) +
        parseFloat(String(newData.reg_fee || 0)) +
        parseFloat(String(newData.other_fee || 0));
    }
    if (modalType === 'loans') newData.bank = 'Loan';

    if (
      (modalType === 'payments' ||
        modalType === 'others' ||
        modalType === 'discounts' ||
        modalType === 'loans') &&
      !newData.name &&
      newData.reg_no
    ) {
      try {
        const res = await lookupStudentRequest(String(newData.reg_no));
        const json = await res.json();
        if (json.status === 'success' && json.student) newData.name = json.student.name;
      } catch {
        /* ignore */
      }
    }

    const isEdit = !!editingId;
    setShowModal(false);
    setFormData({});
    setEditingId(null);

    let actionType = modalType.slice(0, -1);
    if (modalType === 'others') actionType = 'other';
    if (modalType === 'loans') actionType = 'payment';

    const apiData = { ...newData };
    if (!isEdit) {
      delete apiData.id;
      apiData.id = -1;
    }

    const success = await postToApi(`save_${actionType}`, { data: apiData, id: isEdit ? editingId : null }, true);
    if (success) {
      if (modalType === 'fees' || modalType === 'banks') loadMeta();
      else if (TAB_TABLES.has(modalType) || modalType === 'loans')
        loadTablePage(modalType === 'loans' ? 'loans' : modalType, isEdit ? currentPage : 1);
    }
  };

  const openModal = (type: string, item: TableRow | null = null) => {
    setModalType(type);
    if (item) {
      setFormData({ ...item });
      setEditingId(item.id || item.reg_no || null);
    } else {
      setFormData(
        type === 'users'
          ? { role: 'user', permissions: [] }
          : type === 'loans'
            ? { bank: 'Loan' }
            : {},
      );
      setEditingId(null);
    }
    setShowModal(true);
  };

  const handleRegChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const reg = e.target.value;
    if (modalType === 'students') {
      const updates: Record<string, string> = { reg_no: reg };
      const degree = parseDegreeFromReg(reg);
      if (degree) updates.degree = degree;
      setFormData((prev) => ({ ...prev, ...updates }));
      return;
    }
    setFormData((prev) => ({ ...prev, reg_no: reg }));
    if (!reg || reg.length < 3) return;
    try {
      const res = await lookupStudentRequest(reg);
      const json = await res.json();
      if (json.status === 'success' && json.student) {
        setFormData((prev) => ({ ...prev, reg_no: reg, name: json.student.name }));
      }
    } catch {
      /* ignore */
    }
  };

  const getHeaders = (type: string): string[] => {
    switch (type) {
      case 'students':
        return ['reg_no', 'name', 'degree', 'batch', 'mobile', 'email', 'total_package'];
      case 'fees':
        return ['degree', 'batch', 'per_cr_fee', 'per_course_fee', 'reg_fee', 'other_fee'];
      case 'enrollments':
        return ['reg_no', 'name', 'semester', 'cr', 'courses'];
      case 'payments':
        return ['reg_no', 'name', 'semester', 'amount', 'date', 'bank'];
      case 'loans':
        return ['reg_no', 'name', 'semester', 'amount', 'date'];
      case 'discounts':
        return ['reg_no', 'name', 'term', 'discount'];
      case 'others':
        return ['reg_no', 'name', 'semester', 'fee_name', 'amount'];
      case 'users':
        return ['username', 'password', 'role', 'permissions'];
      case 'banks':
        return ['name', 'account_no'];
      default:
        return [];
    }
  };

  const handleFullBackup = async () => {
    let exportData: Record<string, TableRow[]>;
    try {
      const res = await exportAllRequest();
      const json = await res.json();
      if (json.status !== 'success') return alert(json.message || 'Export failed');
      exportData = json.data;
    } catch {
      return alert('Network Error');
    }

    const wb = XLSX.utils.book_new();
    const categories = ['students', 'fees', 'enrollments', 'payments', 'discounts', 'others', 'loans', 'users', 'banks'];
    const sheetNames: Record<string, string> = { loans: 'Other Bank' };

    let hasData = false;

    categories.forEach((cat) => {
      const records = exportData[cat] || [];
      const headers = getHeaders(cat);
      const displayHeaders = headers.map((h) => (h === 'fee_name' ? 'fee_head' : h));

      let wsData: Record<string, unknown>[] = [];
      if (records.length > 0) {
        hasData = true;
        wsData = records.map((row) => {
          const newRow: Record<string, unknown> = {};
          headers.forEach((h, i) => {
            let val = row[h];
            if (Array.isArray(val)) val = val.join(', ');
            newRow[displayHeaders[i]] = val !== undefined ? val : '';
          });
          return newRow;
        });
      } else {
        const emptyRow: Record<string, string> = {};
        displayHeaders.forEach((h) => {
          emptyRow[h] = '';
        });
        wsData = [emptyRow];
      }

      const ws = XLSX.utils.json_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, sheetNames[cat] || cat.charAt(0).toUpperCase() + cat.slice(1));
    });

    if (!hasData) {
      alert('No data available to backup.');
      return;
    }

    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Fee_System_Full_Backup_${dateStr}.xlsx`);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      const rows = text
        .split('\n')
        .map((r) => r.trim())
        .filter((r) => r);
      if (rows.length < 2) return;
      const headers = rows[0].split(',').map((h) => h.trim().replace(/ /g, '_').toLowerCase());

      let existingData: TableRow[] = [];
      const studentNameMap = new Map<string, string>();
      try {
        const indexRes = await getImportIndexRequest(type);
        const indexJson = await indexRes.json();
        if (indexJson.status === 'success') existingData = indexJson.rows || [];
        if (type !== 'students') {
          const stRes = await getImportIndexRequest('students');
          const stJson = await stRes.json();
          (stJson.rows || []).forEach((s: TableRow) => studentNameMap.set(norm(s.reg_no), String(s.name || '')));
        }
      } catch {
        return alert('Could not load existing records for duplicate check');
      }

      const newItems: Record<string, unknown>[] = [];
      const duplicates: Record<string, unknown>[] = [];
      const updates: Record<string, unknown>[] = [];

      for (let i = 1; i < rows.length; i++) {
        const values = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        const obj: Record<string, unknown> = {};

        headers.forEach((h, index) => {
          let val = values[index] ? values[index].trim() : '';
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);

          if (h.includes('reg') && h.includes('no')) obj.reg_no = val;
          else if ((h.includes('fee') || h.includes('charge') || h.includes('head')) && (h.includes('name') || h.includes('head')))
            obj.fee_name = val;
          else if (h.includes('name') && !h.includes('user') && !h.includes('fee') && !h.includes('head'))
            obj.name = val;
          else if (h.includes('semester')) obj.semester = val;
          else if (h.includes('amount')) obj.amount = val;
          else if (h === 'cr') obj.cr = val;
          else if (h.includes('course')) obj.courses = val;
          else if (h.includes('degree')) obj.degree = val;
          else if (h.includes('batch')) obj.batch = val;
          else if (h.includes('term')) obj.term = val;
          else if (h.includes('fee') && h.includes('name')) obj.fee_name = val;
          else if (h.includes('bank')) obj.bank = val;
          else if (h.includes('mobile')) obj.mobile = val;
          else if (h.includes('email')) obj.email = val;
          else if (h.includes('package') || h.includes('total_package')) obj.total_package = val;
          else obj[h] = val;
        });

        if (importTerm) {
          if (type === 'enrollments' || type === 'payments' || type === 'others' || type === 'loans')
            obj.semester = importTerm;
          else if (type === 'discounts') obj.term = importTerm;
        }
        if (obj.amount) obj.amount = String(obj.amount).replace(/[^0-9.-]/g, '');

        if (type === 'students' && obj.reg_no) {
          const degree = parseDegreeFromReg(obj.reg_no);
          if (degree) obj.degree = degree;
        }

        if (!obj.name && obj.reg_no) {
          const studentName = studentNameMap.get(norm(obj.reg_no));
          if (studentName) obj.name = studentName;
        }

        if (type === 'students') {
          const existingStudent = existingData.find((existing) => norm(existing.reg_no) === norm(obj.reg_no));
          if (existingStudent) {
            const nonEmpty = Object.fromEntries(
              Object.entries(obj).filter(([, v]) => v !== '' && v != null),
            );
            updates.push({ ...existingStudent, ...nonEmpty });
          } else {
            newItems.push(obj);
          }
          continue;
        }

        let isDuplicate = false;
        if (type === 'payments') {
          isDuplicate = existingData.some(
            (existing) =>
              norm(existing.reg_no) === norm(obj.reg_no) &&
              Math.abs(parseFloat(String(existing.amount || 0)) - parseFloat(String(obj.amount || 0))) < 0.01 &&
              existing.date === obj.date &&
              norm(existing.bank) === norm(obj.bank),
          );
        } else if (type === 'loans') {
          isDuplicate = existingData.some(
            (existing) =>
              norm(existing.reg_no) === norm(obj.reg_no) &&
              Math.abs(parseFloat(String(existing.amount || 0)) - parseFloat(String(obj.amount || 0))) < 0.01 &&
              existing.date === obj.date,
          );
        } else if (type === 'fees') {
          isDuplicate = existingData.some(
            (existing) => norm(existing.degree) === norm(obj.degree) && norm(existing.batch) === norm(obj.batch),
          );
        } else {
          isDuplicate = existingData.some(
            (existing) =>
              norm(existing.reg_no) === norm(obj.reg_no) &&
              ((existing.semester && norm(existing.semester) === norm(obj.semester)) ||
                (existing.term && norm(existing.term) === norm(obj.term))),
          );
        }

        if (isDuplicate) duplicates.push(obj);
        else newItems.push(obj);
      }

      setImportPreview({ show: true, total: rows.length - 1, newItems, duplicates, updates, type });
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const confirmImport = async () => {
    const toSave = [...importPreview.newItems, ...(importPreview.updates || [])];
    setUploadStatus({ active: true, current: 0, total: toSave.length });
    let actionType = importPreview.type.slice(0, -1);
    if (importPreview.type === 'others') actionType = 'other';
    if (importPreview.type === 'loans') actionType = 'payment';
    let uploadedCount = 0;

    const chunkSize = 25;
    for (let i = 0; i < toSave.length; i += chunkSize) {
      const chunk = toSave.slice(i, i + chunkSize);
      await Promise.all(
        chunk.map(async (item) => {
          const payload = importPreview.type === 'loans' ? { ...item, bank: 'Loan' } : item;
          await postToApi(`save_${actionType}`, { data: payload }, true);
        }),
      );
      uploadedCount += chunk.length;
      if (uploadedCount > toSave.length) uploadedCount = toSave.length;
      setUploadStatus((prev) => ({ ...prev, current: uploadedCount }));
    }

    setImportPreview({ show: false, total: 0, newItems: [], duplicates: [], updates: [], type: '' });
    setUploadStatus({ active: false, current: 0, total: 0 });
    alert(`Successfully imported ${uploadedCount} records!`);
    refreshData();
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(new Set(filteredData.map((i) => i.id || i.reg_no || '')));
    else setSelectedIds(new Set());
  };

  const handleSelectRow = (id: string | number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const deleteSelected = async () => {
    let idsToDelete = selectedIds;
    if (activeTab === 'payments') {
      const loanIds = new Set(
        tableRows.filter((p) => selectedIds.has(p.id!) && norm(p.bank) === 'loan').map((p) => p.id!),
      );
      if (loanIds.size > 0) {
        alert(
          `${loanIds.size} selected record(s) are loan-sourced payments and were skipped. Delete them from the "Other Bank" tab instead.`,
        );
        idsToDelete = new Set([...selectedIds].filter((id) => !loanIds.has(id as number)));
      }
    }
    if (idsToDelete.size === 0) {
      setSelectedIds(new Set());
      return;
    }
    if (!confirm(`Delete ${idsToDelete.size} records?`)) return;

    for (const id of idsToDelete) {
      let type = activeTab;
      if (type === 'others') type = 'other';
      if (type === 'loans') type = 'payments';
      await postToApi(`delete_${type.slice(0, -1)}`, { id }, true);
    }
    setSelectedIds(new Set());
    loadTablePage(activeTab, currentPage);
    loadMeta();
  };

  const deleteAllInTab = async () => {
    if (!confirm(`Permanently delete ALL ${TABS.find((t) => t.id === activeTab)?.label || activeTab} records?`))
      return;
    const ok = await postToApi('delete_all', { table: activeTab }, true);
    if (ok) {
      setTableRows([]);
      setTableTotal(0);
      loadMeta();
    }
  };

  const deleteBySemester = async () => {
    const term = prompt('Enter Semester Name to delete:');
    if (!term) return;
    const ok = await postToApi('delete_semester', { table: activeTab, term }, true);
    if (ok) {
      loadTablePage(activeTab, 1);
      loadMeta();
    }
  };

  const togglePermission = (tabId: string) => {
    const perms = (formData.permissions as string[]) || [];
    if (perms.includes(tabId))
      setFormData({ ...formData, permissions: perms.filter((p) => p !== tabId) });
    else setFormData({ ...formData, permissions: [...perms, tabId] });
  };

  const downloadSample = (type: string) => {
    const headers = getHeaders(type);
    const displayHeaders = headers.map((h) => (h === 'fee_name' ? 'fee_head' : h));
    const csvContent = 'data:text/csv;charset=utf-8,' + displayHeaders.join(',');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${type}_sample.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExport = async (type: string) => {
    let records: TableRow[] = [];
    if (type === activeTab) {
      records = filteredData;
    } else {
      try {
        const res = await fetchTableRequest({
          table: type,
          page: 1,
          limit: 50000,
          search: '',
          sortKey: 'id',
          sortDir: 'desc',
        });
        const json = await res.json();
        if (json.status === 'success') records = json.rows || [];
      } catch {
        return alert('Export failed');
      }
    }
    if (!records || records.length === 0) return alert('No data to export');
    const headers = getHeaders(type);
    const displayHeaders = headers.map((h) => (h === 'fee_name' ? 'fee_head' : h));

    const csvRows = [
      displayHeaders.join(','),
      ...records.map((row) =>
        headers
          .map((fieldName) => {
            let val: unknown = row[fieldName];
            if (Array.isArray(val)) val = val.join('|');
            let str = String(val || '');
            if (str.search(/("|,|\n)/g) >= 0) {
              str = `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(','),
      ),
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${type}_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return {
    user,
    activeTab,
    setActiveTab,
    isFetching,
    meta,
    tableRows,
    tableTotal,
    tableStats,
    loanSemesterStats,
    summaryData,
    summaryLoading,
    clearanceLoading,
    data,
    searchReg,
    setSearchReg,
    filterSession,
    setFilterSession,
    summaryFilterSession,
    setSummaryFilterSession,
    tabSearch,
    setTabSearch,
    selectedIds,
    clearanceResult,
    currentPage,
    setCurrentPage,
    showModal,
    setShowModal,
    modalType,
    editingId,
    formData,
    setFormData,
    loginData,
    setLoginData,
    showPasswordModal,
    setShowPasswordModal,
    passwordData,
    setPasswordData,
    sortConfig,
    importPreview,
    setImportPreview,
    uploadStatus,
    importTerm,
    setImportTerm,
    sidebarOpen,
    setSidebarOpen,
    sessionDetail,
    setSessionDetail,
    printOrientation,
    setPrintOrientation,
    loanDateFrom,
    setLoanDateFrom,
    loanDateTo,
    setLoanDateTo,
    settingsForm,
    setSettingsForm,
    settingsSaving,
    sendPanel,
    setSendPanel,
    sendBusy,
    availableTabs,
    paginatedData,
    totalPages,
    uniqueSessions,
    paymentStats,
    handleLogin,
    handleLogout,
    handleChangePassword,
    handleSort,
    generateReport,
    handleDelete,
    handleSave,
    openModal,
    handleRegChange,
    handleFullBackup,
    handleImport,
    confirmImport,
    handleSelectAll,
    handleSelectRow,
    deleteSelected,
    deleteAllInTab,
    deleteBySemester,
    togglePermission,
    downloadSample,
    handleExport,
    getHeaders,
    openSessionDetail,
    exportSessionDetailExcel,
    exportSessionDetailCsv,
    syncBrowserDataToDb,
    saveSettings,
    sendClearance,
    norm,
    num,
  };
}

export type FeeAppState = ReturnType<typeof useFeeApp>;
