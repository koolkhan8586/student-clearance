import type { SVGProps } from 'react';

interface IconProps extends SVGProps<SVGSVGElement> {
  d?: string;
}

const Icon = ({ d, ...props }: IconProps) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

export const Search = (p: SVGProps<SVGSVGElement>) => (
  <Icon d="M21 21l-4.35-4.35M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0z" {...p} />
);
export const Plus = (p: SVGProps<SVGSVGElement>) => (
  <Icon d="M12 5v14M5 12h14" {...p} />
);
export const Trash2 = (p: SVGProps<SVGSVGElement>) => (
  <Icon d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" {...p} />
);
export const FileText = (p: SVGProps<SVGSVGElement>) => (
  <Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" {...p} />
);
export const Users = (p: SVGProps<SVGSVGElement>) => (
  <Icon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" {...p} />
);
export const DollarSign = (p: SVGProps<SVGSVGElement>) => (
  <Icon d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" {...p} />
);
export const BookOpen = (p: SVGProps<SVGSVGElement>) => (
  <Icon d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" {...p} />
);
export const CreditCard = (p: SVGProps<SVGSVGElement>) => (
  <Icon d="M1 4h22v16H1zM1 10h22" {...p} />
);
export const Percent = (p: SVGProps<SVGSVGElement>) => (
  <Icon d="M19 5L5 19M6.5 6.5h0M17.5 17.5h0" {...p} />
);
export const Printer = (p: SVGProps<SVGSVGElement>) => (
  <Icon d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" {...p} />
);
export const Download = (p: SVGProps<SVGSVGElement>) => (
  <Icon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" {...p} />
);
export const Upload = (p: SVGProps<SVGSVGElement>) => (
  <Icon d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" {...p} />
);
export const FileSpreadsheet = (p: SVGProps<SVGSVGElement>) => (
  <Icon d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" {...p} />
);
export const XSquare = (p: SVGProps<SVGSVGElement>) => (
  <Icon d="M3 3h18v18H3zM9 9l6 6M15 9l-6 6" {...p} />
);
export const AlertCircle = (p: SVGProps<SVGSVGElement>) => (
  <Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" {...p} />
);
export const CalendarX = (p: SVGProps<SVGSVGElement>) => (
  <Icon d="M3 4h18v18H3zM16 2v4M8 2v4M3 10h18" {...p} />
);
export const LogOut = (p: SVGProps<SVGSVGElement>) => (
  <Icon d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-12-5-7M21 12H9" {...p} />
);
export const Shield = (p: SVGProps<SVGSVGElement>) => (
  <Icon d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" {...p} />
);
export const Key = (p: SVGProps<SVGSVGElement>) => (
  <Icon d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" {...p} />
);
export const CloudUpload = (p: SVGProps<SVGSVGElement>) => (
  <Icon d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19a4 4 0 0 0 4 4h11a4 4 0 0 0 4-4v-2.5" {...p} />
);
export const Landmark = (p: SVGProps<SVGSVGElement>) => (
  <Icon d="M3 22v-8h18v8M12 2L2 7v3h20V7L12 2zM6 10v6M10 10v6M14 10v6M18 10v6" {...p} />
);
export const Menu = (p: SVGProps<SVGSVGElement>) => (
  <Icon d="M3 12h18M3 6h18M3 18h18" {...p} />
);
export const BarChart = (p: SVGProps<SVGSVGElement>) => (
  <Icon d="M12 20V10M18 20V4M6 20v-4" {...p} />
);
export const Eye = (p: SVGProps<SVGSVGElement>) => (
  <Icon d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 5c-3.866 0-7 3.134-7 7s3.134 7 7 7 7-3.134 7-7-3.134-7-7-7z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" {...p} />
);
export const RefreshCw = (p: SVGProps<SVGSVGElement>) => (
  <Icon d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" {...p} />
);
export const Wallet = (p: SVGProps<SVGSVGElement>) => (
  <Icon d="M21 12V7H5a2 2 0 0 1 0-4h14v4M3 5v14a2 2 0 0 0 2 2h16v-5M18 12a2 2 0 0 0 0 4h4v-4h-4z" {...p} />
);
export const SettingsIcon = (p: SVGProps<SVGSVGElement>) => (
  <Icon
    d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
    {...p}
  />
);
