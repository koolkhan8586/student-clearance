import { Download, FileSpreadsheet, Printer } from '../icons';
import type { SessionDetail } from '../../types';

interface SessionDetailModalProps {
  sessionDetail: SessionDetail;
  onClose: () => void;
  onExportExcel: () => void;
  onExportCsv: () => void;
  num: (n: unknown) => string;
}

export function SessionDetailModal({
  sessionDetail,
  onClose,
  onExportExcel,
  onExportCsv,
  num,
}: SessionDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4 print:p-0 print:block print:relative">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col print:h-auto print:shadow-none print:w-full print:max-w-none">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-xl no-print">
          <h3 className="text-xl font-bold">Session Detail: {sessionDetail.session}</h3>
          <div className="flex gap-2">
            <button onClick={onExportExcel} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              <FileSpreadsheet className="h-4 w-4 inline mr-2" /> Export Excel
            </button>
            <button onClick={onExportCsv} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              <Download className="h-4 w-4 inline mr-2" /> Export CSV
            </button>
            <button onClick={() => window.print()} className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800">
              <Printer className="h-4 w-4 inline mr-2" /> Print Report
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
              &times;
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6 print:overflow-visible print:p-0" id="printableArea">
          <div className="hidden print-only-header mb-4 border-b-2 border-gray-800 pb-4">
            <div className="flex justify-between items-start">
              <div className="w-32 h-32 rounded-lg flex items-center justify-center font-bold text-gray-400 overflow-hidden">
                <img src="UOL-Green-V1.png" alt="UOL Logo" className="w-full h-full object-contain" />
              </div>
              <div className="text-center flex-1 px-4">
                <h2 className="text-2xl font-bold text-gray-900 uppercase">The University of Lahore</h2>
                <p className="text-gray-600 font-medium">School of Accountancy & Finance</p>
                <div className="inline-block bg-gray-100 px-3 py-1 rounded mt-2 text-xs font-bold uppercase tracking-wider">
                  Session Detail Report: {sessionDetail.session}
                </div>
                <div className="text-xs text-gray-500 mt-1">Generated: {new Date().toLocaleDateString()}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-4 mb-6 text-sm no-print">
            <div className="border p-2 rounded">
              <b>Enrolled:</b> {sessionDetail.enrolled}
            </div>
            <div className="border p-2 rounded">
              <b>Charged:</b> {num(sessionDetail.charged)}
            </div>
            <div className="border p-2 rounded">
              <b>Discount:</b> {num(sessionDetail.discount)}
            </div>
            <div className="border p-2 rounded">
              <b>Paid:</b> {num(sessionDetail.paid)}
            </div>
            <div className="border p-2 rounded bg-gray-100">
              <b>Balance:</b> {num(sessionDetail.balance)}
            </div>
          </div>

          <table className="w-full text-xs text-left border-collapse session-detail-table">
            <thead className="bg-gray-100 uppercase font-bold text-gray-700">
              <tr>
                <th className="p-2 border">#</th>
                <th className="p-2 border">Reg No</th>
                <th className="p-2 border">Name</th>
                <th className="p-2 border text-center">Courses</th>
                <th className="p-2 border text-center">Cr</th>
                <th className="p-2 border text-right">Tuition</th>
                <th className="p-2 border text-right">Exam Fee</th>
                <th className="p-2 border text-right">Discount</th>
                <th className="p-2 border text-right">Total</th>
                <th className="p-2 border text-right">Paid</th>
                <th className="p-2 border text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {sessionDetail.details.map((s, idx) => (
                <tr key={idx} className="border-b">
                  <td className="p-2 border">{idx + 1}</td>
                  <td className="p-2 border font-mono">{s.reg_no}</td>
                  <td className="p-2 border">{s.name}</td>
                  <td className="p-2 border text-center">{s.courses}</td>
                  <td className="p-2 border text-center">{s.cr}</td>
                  <td className="p-2 border text-right">{num(s.tuition)}</td>
                  <td className="p-2 border text-right">{num(s.exam)}</td>
                  <td className="p-2 border text-right text-red-500">{num(s.discount)}</td>
                  <td className="p-2 border text-right font-bold">
                    {num(s.tuition + s.exam + s.other - s.discount)}
                  </td>
                  <td className="p-2 border text-right text-green-700">{num(s.paid)}</td>
                  <td className="p-2 border text-right font-bold">{num(s.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
