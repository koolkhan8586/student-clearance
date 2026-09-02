import {
  AlertCircle,
  BarChart,
  BookOpen,
  CreditCard,
  DollarSign,
  FileText,
  Landmark,
  Percent,
  SettingsIcon,
  Shield,
  Users,
  Wallet,
} from '../components/icons';
import type { TabDef } from '../types';

export const ITEMS_PER_PAGE = 100;

export const TAB_TABLES = new Set([
  'students',
  'fees',
  'enrollments',
  'payments',
  'loans',
  'discounts',
  'others',
  'banks',
  'users',
]);

export const TABS: TabDef[] = [
  { id: 'clearance', label: 'Clearance', icon: FileText },
  { id: 'summary', label: 'Summary', icon: BarChart },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'fees', label: 'Fee Structure', icon: DollarSign },
  { id: 'others', label: 'Other Charges', icon: AlertCircle },
  { id: 'enrollments', label: 'Enrollments', icon: BookOpen },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'loans', label: 'Other Bank', icon: Wallet },
  { id: 'discounts', label: 'Discounts', icon: Percent },
  { id: 'banks', label: 'Banks', icon: Landmark },
];

export const DEFAULT_MESSAGE_TEMPLATE =
  'Dear {name},\n\nYour Fee Clearance Report is ready.\n\nRegistration No: {reg_no}\nDegree Program: {degree}\nBatch/Session: {batch}\n\nTotal Scholarship: {scholarship}\nNet Payable: {net_payable}\n\nRegards,\n{from_name}';

export const ADMIN_EXTRA_TABS: TabDef[] = [
  { id: 'users', label: 'Users & Access', icon: Shield },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];
