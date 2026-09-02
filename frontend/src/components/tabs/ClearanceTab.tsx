import { Printer, Search } from '../icons';
import type { FeeAppState } from '../../hooks/useFeeApp';

interface ClearanceTabProps {
  app: FeeAppState;
}

export function ClearanceTab({ app }: ClearanceTabProps) {
  const {
    user,
    searchReg,
    setSearchReg,
    filterSession,
    setFilterSession,
    uniqueSessions,
    generateReport,
    clearanceLoading,
    clearanceResult,
    printOrientation,
    setPrintOrientation,
    sendPanel,
    setSendPanel,
    sendClearance,
    sendBusy,
    num,
  } = app;

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 no-print">
        <label className="block text-sm font-bold text-gray-700 mb-2">Generate Student Clearance</label>
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={searchReg}
            onChange={(e) => setSearchReg(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generateReport()}
            placeholder="Enter Registration No (e.g. BSCAF052530040)"
            className="flex-1 block w-full rounded-lg border-gray-300 border p-3 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <select
            value={filterSession}
            onChange={(e) => setFilterSession(e.target.value)}
            className="w-full md:w-48 rounded-lg border-gray-300 border p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="">All Sessions</option>
            {uniqueSessions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            onClick={generateReport}
            disabled={clearanceLoading}
            className="w-full md:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Search className="h-5 w-5" /> {clearanceLoading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>

      {clearanceResult && (
        <>
          <div className="no-print flex items-center justify-end gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-200">
            <span className="text-sm font-bold text-gray-700">Print Layout:</span>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                onClick={() => setPrintOrientation('portrait')}
                className={`px-3 py-1.5 text-sm font-medium ${printOrientation === 'portrait' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                Portrait
              </button>
              <button
                onClick={() => setPrintOrientation('landscape')}
                className={`px-3 py-1.5 text-sm font-medium border-l border-gray-300 ${printOrientation === 'landscape' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                Landscape
              </button>
            </div>
            <button
              onClick={() => window.print()}
              className="bg-gray-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center gap-2"
            >
              <Printer className="h-4 w-4" /> Print
            </button>
            <div className="h-6 w-px bg-gray-300"></div>
            <button
              onClick={() => setSendPanel({ channel: 'email', recipient: clearanceResult.student.email || '' })}
              className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Send via Email
            </button>
            <button
              onClick={() => setSendPanel({ channel: 'whatsapp', recipient: clearanceResult.student.mobile || '' })}
              className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Send via WhatsApp
            </button>
          </div>

          {sendPanel && (
            <div className="no-print bg-white p-4 rounded-xl shadow-sm border border-blue-200 flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[220px]">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                  {sendPanel.channel === 'email' ? 'Email address' : 'Mobile number (with country code)'}
                </label>
                <input
                  type={sendPanel.channel === 'email' ? 'email' : 'text'}
                  placeholder={sendPanel.channel === 'email' ? 'name@example.com' : 'e.g. 923001234567'}
                  className="w-full border p-2 rounded"
                  value={sendPanel.recipient}
                  onChange={(e) => setSendPanel({ ...sendPanel, recipient: e.target.value })}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Defaults to the student's registered {sendPanel.channel === 'email' ? 'email' : 'mobile number'} —
                  edit it to send elsewhere (e.g. a parent's number).
                </p>
              </div>
              <button
                onClick={sendClearance}
                disabled={sendBusy}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
              >
                {sendBusy
                  ? sendPanel.channel === 'email'
                    ? 'Generating PDF...'
                    : 'Sending...'
                  : 'Send'}
              </button>
              <button
                onClick={() => setSendPanel(null)}
                disabled={sendBusy}
                className="text-gray-500 hover:text-gray-700 px-3 py-2 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-lg overflow-hidden" id="printableArea">
            <div className="p-8">
              <div className="border-b-2 border-gray-800 pb-6 mb-6 flex justify-between items-start">
                <div className="w-32 h-32 rounded-lg flex items-center justify-center font-bold text-gray-400 overflow-hidden">
                  <img
                    src="UOL-Green-V1.png"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      img.onerror = null;
                      img.src = 'src/UOL-Green-V1.png';
                    }}
                    alt="UOL Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-center flex-1 px-4">
                  <h2 className="text-2xl font-bold text-gray-900 uppercase">The University of Lahore</h2>
                  <p className="text-gray-600 font-medium">School of Accountancy & Finance</p>
                  <div className="inline-block bg-gray-100 px-3 py-1 rounded mt-2 text-xs font-bold uppercase tracking-wider">
                    Fee Clearance Report
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-12 gap-y-4 mb-8 text-sm">
                <div className="flex justify-between border-b border-gray-200 py-1">
                  <span className="font-bold text-gray-600">Registration No:</span>
                  <span className="font-mono font-bold text-gray-900">{clearanceResult.student.reg_no}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 py-1">
                  <span className="font-bold text-gray-600">Student Name:</span>
                  <span className="text-gray-900">{clearanceResult.student.name}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 py-1">
                  <span className="font-bold text-gray-600">Degree Program:</span>
                  <span className="text-gray-900">{clearanceResult.student.degree}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 py-1">
                  <span className="font-bold text-gray-600">Batch / Session:</span>
                  <span className="text-gray-900">{clearanceResult.student.batch}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 py-1">
                  <span className="font-bold text-gray-600">Rate (Per Cr. Hr):</span>
                  <span className="text-gray-900">
                    {clearanceResult.masterFee ? num(clearanceResult.masterFee.per_cr_fee) : '-'}
                  </span>
                </div>
                {clearanceResult.student.total_package && (
                  <div className="flex justify-between border-b border-gray-200 py-1">
                    <span className="font-bold text-gray-600">Total Package:</span>
                    <span className="text-gray-900 font-bold">{num(clearanceResult.student.total_package)}</span>
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs clearance-table">
                  <thead className="bg-gray-100 text-gray-900 font-bold uppercase">
                    <tr>
                      <th className="p-2 border">Sem</th>
                      <th className="p-2 border text-center">Sub</th>
                      <th className="p-2 border text-center">Cr</th>
                      <th className="p-2 border text-right">Tuition</th>
                      <th className="p-2 border text-right">Exam</th>
                      <th className="p-2 border text-right">Reg</th>
                      <th className="p-2 border text-right">Other</th>
                      <th className="p-2 border text-right bg-gray-50">Total</th>
                      <th className="p-2 border text-center">Disc %</th>
                      <th className="p-2 border text-right">D. Amt</th>
                      <th className="p-2 border text-right">Net</th>
                      <th className="p-2 border text-right text-green-700">Paid</th>
                      <th className="p-2 border text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {clearanceResult.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-2 border font-medium">
                          {row.semester}
                          {row.isGapFee && (
                            <span className="ml-1 text-[10px] bg-orange-100 text-orange-700 px-1 py-0.5 rounded font-bold align-middle">
                              {row.feeName || 'Gap Fee'}
                            </span>
                          )}
                          {row.isPaymentOnly && (
                            <span className="ml-1 text-[10px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded font-bold align-middle">
                              Payment (No Enrollment)
                            </span>
                          )}
                        </td>
                        <td className="p-2 border text-center">{row.courses}</td>
                        <td className="p-2 border text-center">{row.cr}</td>
                        <td className="p-2 border text-right text-gray-600">{num(row.tuition)}</td>
                        <td className="p-2 border text-right text-gray-600">{num(row.exam)}</td>
                        <td className="p-2 border text-right text-gray-600">{num(row.reg)}</td>
                        <td className="p-2 border text-right text-gray-600">{num(row.other)}</td>
                        <td className="p-2 border text-right font-bold bg-gray-50">{num(row.total)}</td>
                        <td className="p-2 border text-center text-gray-500">
                          {row.discPct > 0 ? `${row.discPct}%` : '-'}
                        </td>
                        <td className="p-2 border text-right text-gray-500">
                          {row.discAmt > 0 ? num(row.discAmt) : '-'}
                        </td>
                        <td className="p-2 border text-right font-bold">{num(row.netFee)}</td>
                        <td className="p-2 border text-right font-bold text-green-600">{num(row.totalPaid)}</td>
                        <td
                          className={`p-2 border text-right font-bold ${row.balance > 0 ? 'text-red-600' : 'text-green-600'}`}
                        >
                          {num(row.balance)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-800 text-white font-bold">
                      <td className="p-3 text-right uppercase tracking-wider">Totals</td>
                      <td className="p-3 text-center">{clearanceResult.summary.courses}</td>
                      <td className="p-3 text-center">{clearanceResult.summary.cr}</td>
                      <td colSpan={4} className="p-3"></td>
                      <td className="p-3 text-right print-modern-total">{num(clearanceResult.summary.total)}</td>
                      <td className="p-3 text-center">-</td>
                      <td className="p-3 text-right">{num(clearanceResult.summary.fa)}</td>
                      <td className="p-3 text-right">
                        {num(clearanceResult.summary.total - clearanceResult.summary.fa)}
                      </td>
                      <td className="p-3 text-right text-green-400">{num(clearanceResult.summary.paid)}</td>
                      <td
                        className={`p-3 text-right ${clearanceResult.summary.balance > 0 ? 'text-red-400' : 'text-green-400'}`}
                      >
                        {num(clearanceResult.summary.balance)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex justify-between items-end">
                <div className="text-xs text-gray-500">
                  <p>
                    Printed by: <span className="font-bold text-gray-800">{user.username}</span>
                  </p>
                  <p>Time: {new Date().toLocaleString('en-US', { timeZone: 'Asia/Karachi' })}</p>
                </div>
                <div className="w-64 bg-gray-50 p-4 rounded border border-gray-200">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Total Scholarship:</span>
                    <span className="font-bold text-green-600">{num(clearanceResult.summary.fa)}</span>
                  </div>
                  <div className="border-t border-gray-300 my-2"></div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Net Payable:</span>
                    <span className="text-red-600">{num(clearanceResult.summary.balance)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
