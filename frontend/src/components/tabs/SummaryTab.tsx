import { Eye, Printer } from '../icons';
import type { FeeAppState } from '../../hooks/useFeeApp';

interface SummaryTabProps {
  app: FeeAppState;
}

export function SummaryTab({ app }: SummaryTabProps) {
  const {
    summaryFilterSession,
    setSummaryFilterSession,
    uniqueSessions,
    summaryLoading,
    summaryData,
    openSessionDetail,
    num,
    sessionDetail,
  } = app;

  return (
    <div className="landscape-mode-print">
      <h2 className="text-2xl font-bold text-gray-800 capitalize mb-6">Financial Summary</h2>
      <div className="flex items-center gap-3 mb-4 no-print">
        <label className="font-medium text-sm">Filter Semester:</label>
        <select
          value={summaryFilterSession}
          onChange={(e) => setSummaryFilterSession(e.target.value)}
          className="w-48 rounded-lg border-gray-300 border p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
        >
          <option value="">All Semesters</option>
          {uniqueSessions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button onClick={() => window.print()} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg" title="Print Summary">
          <Printer className="h-5 w-5" />
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden" id={!sessionDetail ? 'printableArea' : ''}>
        <div className="p-4 hidden print-only">
          <h2 className="text-xl font-bold text-center uppercase mb-4">Financial Summary Report</h2>
          {summaryFilterSession && <p className="text-center text-sm mb-4">Filter: {summaryFilterSession}</p>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left summary-table">
            <thead className="bg-gray-50 text-gray-700 uppercase font-bold text-xs border-b border-gray-200">
              <tr>
                <th className="p-4">Session</th>
                <th className="p-4 text-center">Enrolled</th>
                <th className="p-4 text-right">Total Charged</th>
                <th className="p-4 text-right">Exam Fee</th>
                <th className="p-4 text-right">Discounts</th>
                <th className="p-4 text-right">Other Charges</th>
                <th className="p-4 text-right">Total Paid</th>
                <th className="p-4 text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {summaryLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-blue-500 font-bold">
                    <i className="fas fa-circle-notch fa-spin mr-2"></i> Loading summary...
                  </td>
                </tr>
              ) : (
                summaryData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => openSessionDetail(row)}>
                    <td className="p-4 font-bold text-blue-600 hover:text-blue-800 flex items-center gap-2">
                      <Eye className="h-4 w-4" /> {row.session}
                    </td>
                    <td className="p-4 text-center">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">{row.enrolled}</span>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-gray-800">{num(row.charged)}</td>
                    <td className="p-4 text-right font-mono text-gray-600">{num(row.exam)}</td>
                    <td className="p-4 text-right font-mono text-orange-600">{num(row.discount)}</td>
                    <td className="p-4 text-right font-mono text-gray-600">{num(row.other)}</td>
                    <td className="p-4 text-right font-mono font-bold text-green-600">{num(row.paid)}</td>
                    <td
                      className={`p-4 text-right font-mono font-bold ${row.balance > 0 ? 'text-red-600' : 'text-green-600'}`}
                    >
                      {num(row.balance)}
                    </td>
                  </tr>
                ))
              )}
              {summaryData.length === 0 && !summaryLoading && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-400">
                    No session data available.
                  </td>
                </tr>
              )}
              {summaryData.length > 0 && (
                <tr className="bg-gray-800 text-white font-bold">
                  <td className="p-4">TOTALS</td>
                  <td className="p-4 text-center">{summaryData.reduce((s, r) => s + r.enrolled, 0)}</td>
                  <td className="p-4 text-right">{num(summaryData.reduce((s, r) => s + r.charged, 0))}</td>
                  <td className="p-4 text-right">{num(summaryData.reduce((s, r) => s + r.exam, 0))}</td>
                  <td className="p-4 text-right">{num(summaryData.reduce((s, r) => s + r.discount, 0))}</td>
                  <td className="p-4 text-right">{num(summaryData.reduce((s, r) => s + r.other, 0))}</td>
                  <td className="p-4 text-right text-green-400">{num(summaryData.reduce((s, r) => s + r.paid, 0))}</td>
                  <td className="p-4 text-right text-red-400">{num(summaryData.reduce((s, r) => s + r.balance, 0))}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
