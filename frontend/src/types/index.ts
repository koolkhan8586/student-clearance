import type { ComponentType, SVGProps } from 'react';

export interface User {
  id?: number;
  username: string;
  role: 'admin' | 'user' | string;
  permissions: string[];
}

export interface Meta {
  fees: FeeStructure[];
  banks: Bank[];
  sessions: string[];
  counts: Record<string, number>;
  users: UserRecord[];
}

export interface FeeStructure {
  id?: number;
  degree: string;
  batch: string;
  per_cr_fee?: number | string;
  per_course_fee?: number | string;
  reg_fee?: number | string;
  other_fee?: number | string;
  tuition_fee?: number;
  exam_fee?: number;
  total_fee?: number;
  total_courses?: number | string;
  cr?: number | string;
}

export interface Bank {
  id?: number;
  name: string;
  account_no?: string;
}

export interface UserRecord {
  id?: number;
  username: string;
  role: string;
  permissions?: string[] | string;
  password?: string;
}

export interface Student {
  reg_no: string;
  name: string;
  degree?: string;
  batch?: string;
  mobile?: string;
  email?: string;
  total_package?: number | string;
}

export interface ClearanceRow {
  semester: string;
  courses: number;
  cr: number;
  tuition: number;
  exam: number;
  reg: number;
  other: number;
  total: number;
  discPct: number;
  discAmt: number;
  netFee: number;
  totalPaid: number;
  balance: number;
  isGapFee?: boolean;
  isPaymentOnly?: boolean;
  feeName?: string;
}

export interface ClearanceSummary {
  courses: number;
  cr: number;
  total: number;
  fa: number;
  paid: number;
  balance: number;
}

export interface ClearanceReport {
  student: Student;
  masterFee?: FeeStructure | null;
  rows: ClearanceRow[];
  summary: ClearanceSummary;
}

export interface SummaryRow {
  session: string;
  enrolled: number;
  charged: number;
  exam: number;
  discount: number;
  other: number;
  paid: number;
  balance: number;
  details: SessionDetailStudent[];
}

export interface SessionDetailStudent {
  reg_no: string;
  name: string;
  courses: number;
  cr: number;
  tuition: number;
  exam: number;
  other: number;
  discount: number;
  paid: number;
  balance: number;
}

export interface SessionDetail extends SummaryRow {}

export interface PaymentStats {
  total: number;
  bank: number;
  cash: number;
}

export interface LoanSemesterStat {
  semester: string;
  total: number;
  count: number;
}

export interface TableStats {
  total?: number | string;
  bank?: number | string;
  cash?: number | string;
}

export interface SortConfig {
  key: string | null;
  direction: 'asc' | 'desc';
}

export interface ImportPreview {
  show: boolean;
  total: number;
  newItems: Record<string, unknown>[];
  duplicates: Record<string, unknown>[];
  updates: Record<string, unknown>[];
  type: string;
}

export interface UploadStatus {
  active: boolean;
  current: number;
  total: number;
}

export interface SendPanel {
  channel: 'email' | 'whatsapp';
  recipient: string;
}

export interface SettingsForm {
  message_template?: string;
  waha_url?: string;
  waha_session?: string;
  waha_api_key?: string;
  has_waha_api_key?: boolean;
  google_delegated_user?: string;
  google_service_account_json?: string;
  has_google_service_account?: boolean;
  brevo_api_key?: string;
  has_brevo_api_key?: boolean;
  smtp_host?: string;
  smtp_port?: string | number;
  smtp_username?: string;
  smtp_password?: string;
  has_smtp_password?: boolean;
  smtp_from_email?: string;
  smtp_from_name?: string;
  [key: string]: unknown;
}

export interface TabDef {
  id: string;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
}

export interface ApiResponse {
  status: 'success' | 'error';
  message?: string;
  [key: string]: unknown;
}

export type TableRow = Record<string, unknown> & {
  id?: number | string;
  reg_no?: string;
  name?: string;
  bank?: string;
};
