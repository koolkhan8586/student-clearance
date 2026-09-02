import {
  CalendarX,
  Download,
  FileSpreadsheet,
  Plus,
  Search,
  Trash2,
  Upload,
  XSquare,
} from '../icons';
import { ITEMS_PER_PAGE, TABS } from '../../utils/constants';
import type { FeeAppState } from '../../hooks/useFeeApp';
import type { TableRow } from '../../types';

interface DataDirectoryTabProps {
  app: FeeAppState;
}

export function DataDirectoryTab({ app }: DataDirectoryTabProps) {
  const {
    user,
    activeTab,
    tabSearch,
    setTabSearch,
    tableTotal,
    selectedIds,
    deleteSelected,
    deleteBySemester,
    deleteAllInTab,
    downloadSample,
    handleImport,
    handleExport,
    importTerm,
    setImportTerm,
    paymentStats,
    loanDateFrom,
    setLoanDateFrom,
    loanDateTo,
    setLoanDateTo,
    tableStats,
    loanSemesterStats,
    isFetching,
    tableRows,
    paginatedData,
    handleSelectAll,
    selectedIds: selected,
    handleSelectRow,
    getHeaders,
    handleSort,
    sortConfig,
    openModal,
    handleDelete,
    norm,
    num,
    currentPage,
    setCurrentPage,
    totalPages,
  } = app;

  if (!user) return null;

  const renderRowCells = (item: TableRow) => {
    switch (activeTab) {
      case 'students':
        return (
          <>
            <td className="p-4 font-mono">{String(item.reg_no ?? '')}</td>
            <td className="p-4 font-bold">{String(item.name ?? '')}</td>
            <td className="p-4">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">{String(item.degree ?? '')}</span>
            </td>
            <td className="p-4 text-gray-500">{String(item.batch ?? '')}</td>
            <td className="p-4 text-gray-500">{String(item.mobile || '-')}</td>
            <td className="p-4 text-gray-500">{String(item.email || '-')}</td>
            <td className="p-4 font-bold text-green-700">
              {item.total_package ? num(item.total_package) : '-'}
            </td>
          </>
        );
      case 'fees':
        return (
          <>
            <td className="p-4 font-bold">{String(item.degree ?? '')}</td>
            <td className="p-4 text-gray-600">{String(item.batch ?? '')}</td>
            <td className="p-4 text-right text-gray-500">{num(item.per_cr_fee)}</td>
            <td className="p-4 text-right font-bold text-green-700">{num(item.per_course_fee)}</td>
            <td className="p-4 text-right text-gray-500">{num(item.reg_fee)}</td>
            <td className="p-4 text-right text-gray-500">{num(item.other_fee)}</td>
          </>
        );
      case 'enrollments':
        return (
          <>
            <td className="p-4 font-mono">{String(item.reg_no ?? '')}</td>
            <td className="p-4">{String(item.name ?? '')}</td>
            <td className="p-4">
              <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs font-bold">{String(item.semester ?? '')}</span>
            </td>
            <td className="p-4">{String(item.cr ?? '')}</td>
            <td className="p-4">{String(item.courses ?? '')}</td>
          </>
        );
      case 'payments':
        return (
          <>
            <td className="p-4 font-mono">{String(item.reg_no ?? '')}</td>
            <td className="p-4">{String(item.name ?? '')}</td>
            <td className="p-4">
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">{String(item.semester ?? '')}</span>
            </td>
            <td className="p-4 text-right font-bold">{num(item.amount)}</td>
            <td className="p-4 text-gray-500">{String(item.date ?? '')}</td>
            <td className="p-4 text-gray-500">{item.bank === 'Loan' ? '' : String(item.bank ?? '')}</td>
          </>
        );
      case 'loans':
        return (
          <>
            <td className="p-4 font-mono">{String(item.reg_no ?? '')}</td>
            <td className="p-4">{String(item.name ?? '')}</td>
            <td className="p-4">
              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-bold">{String(item.semester ?? '')}</span>
            </td>
            <td className="p-4 text-right font-bold">{num(item.amount)}</td>
            <td className="p-4 text-gray-500">{String(item.date ?? '')}</td>
          </>
        );
      case 'others':
        return (
          <>
            <td className="p-4 font-mono">
              {item.reg_no || <span className="text-orange-600 font-sans font-bold">ALL (Gap Fee)</span>}
            </td>
            <td className="p-4">{String(item.name ?? '')}</td>
            <td className="p-4 text-gray-600">{String(item.semester ?? '')}</td>
            <td className="p-4">
              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-bold">{String(item.fee_name ?? '')}</span>
            </td>
            <td className="p-4 text-right font-bold">{num(item.amount)}</td>
          </>
        );
      case 'discounts':
        return (
          <>
            <td className="p-4 font-mono">{String(item.reg_no ?? '')}</td>
            <td className="p-4">{String(item.name ?? '')}</td>
            <td className="p-4 text-gray-500">{String(item.term ?? '')}</td>
            <td className="p-4 text-right font-bold text-purple-600">{String(item.discount ?? '')}%</td>
          </>
        );
      case 'users':
        return (
          <>
            <td className="p-4 font-bold">{String(item.username ?? '')}</td>
            <td className="p-4 capitalize">{String(item.role ?? '')}</td>
            <td className="p-4 text-xs max-w-xs truncate">
              {item.role === 'admin'
                ? 'Full Access'
                : Array.isArray(item.permissions)
                  ? item.permissions.join(', ')
                  : String(item.permissions ?? '')}
            </td>
          </>
        );
      case 'banks':
        return (
          <>
            <td className="p-4 font-bold">{String(item.name ?? '')}</td>
            <td className="p-4 font-mono text-gray-600">{String(item.account_no ?? '')}</td>
          </>
        );
      default:
        return null;
    }
  };

  const canAdd = user.role === 'admin' || user.permissions.includes(activeTab);

  return (
    <div>
      <div className="flex flex-col gap-4 mb-6 no-print">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 capitalize">
            {TABS.find((t) => t.id === activeTab)?.label || activeTab} Directory
          </h2>
          <div className="flex gap-2">
            {canAdd && (
              <button
                onClick={() => openModal(activeTab)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-sm"
              >
                <Plus className="h-5 w-5" /> Add New
              </button>
            )}
          </div>
        </div>
        <div className="bg-white p-3 rounded-xl border border-gray-200 flex flex-wrap gap-3 items-center justify-between shadow-sm">
          <div className="relative flex-grow max-w-md flex items-center gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={tabSearch}
                onChange={(e) => setTabSearch(e.target.value)}
                placeholder={`Filter ${TABS.find((t) => t.id === activeTab)?.label || activeTab}...`}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
              Showing {tableTotal} Records
            </span>
          </div>

          <div className="flex gap-2 flex-wrap md:flex-nowrap">
            {selectedIds.size > 0 && (
              <button
                onClick={deleteSelected}
                className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm font-bold hover:bg-red-100 flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" /> Delete ({selectedIds.size})
              </button>
            )}
            {(activeTab === 'enrollments' ||
              activeTab === 'payments' ||
              activeTab === 'others' ||
              activeTab === 'loans') && (
              <button
                onClick={deleteBySemester}
                className="bg-orange-50 border border-orange-200 text-orange-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-orange-100 flex items-center gap-2"
              >
                <CalendarX className="h-4 w-4" /> Del Sem
              </button>
            )}
            {user.role === 'admin' && (
              <button
                onClick={deleteAllInTab}
                className="bg-white border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-50 flex items-center gap-2"
              >
                <XSquare className="h-4 w-4" /> Delete All
              </button>
            )}
            <div className="h-8 w-px bg-gray-300 mx-1"></div>
            <button
              onClick={() => downloadSample(activeTab)}
              className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" /> Sample
            </button>
            <label className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 cursor-pointer flex items-center gap-2">
              <Download className="h-4 w-4" />
              <input type="file" onChange={(e) => handleImport(e, activeTab)} className="hidden" accept=".csv" />
            </label>
            <button
              onClick={() => handleExport(activeTab)}
              className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
            >
              <Upload className="h-4 w-4" /> Export
            </button>
          </div>
        </div>

        {(activeTab === 'enrollments' ||
          activeTab === 'payments' ||
          activeTab === 'others' ||
          activeTab === 'discounts' ||
          activeTab === 'loans') && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-2 mb-4 text-sm flex items-center gap-2 no-print">
            <span className="font-bold">Import Setting:</span>
            <input
              type="text"
              placeholder="Default Semester/Term (e.g. Fall 2024)"
              value={importTerm}
              onChange={(e) => setImportTerm(e.target.value)}
              className="border p-1 rounded px-2 w-full md:w-64"
            />
            <span className="text-gray-500 text-xs hidden md:inline">
              (If provided, this will be applied to all imported records)
            </span>
          </div>
        )}
      </div>

      {activeTab === 'payments' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 no-print">
          <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-green-500">
            <div className="text-xs font-bold text-gray-500 uppercase">Total Received</div>
            <div className="text-2xl font-bold text-gray-800">{num(paymentStats.total)}</div>
            <div className="text-xs text-green-600 mt-1">Based on current filter</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500">
            <div className="text-xs font-bold text-gray-500 uppercase">JT Branch</div>
            <div className="text-2xl font-bold text-gray-800">{num(paymentStats.bank)}</div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-orange-500">
            <div className="text-xs font-bold text-gray-500 uppercase">Other Bank</div>
            <div className="text-2xl font-bold text-gray-800">{num(paymentStats.cash)}</div>
          </div>
        </div>
      )}

      {activeTab === 'loans' && (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 no-print flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">From Date</label>
            <input
              type="date"
              value={loanDateFrom}
              onChange={(e) => setLoanDateFrom(e.target.value)}
              className="border p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">To Date</label>
            <input
              type="date"
              value={loanDateTo}
              onChange={(e) => setLoanDateTo(e.target.value)}
              className="border p-2 rounded"
            />
          </div>
          {(loanDateFrom || loanDateTo) && (
            <>
              <div className="bg-purple-50 border-l-4 border-purple-500 rounded-lg px-4 py-2">
                <div className="text-xs font-bold text-gray-500 uppercase">Total for Selected Dates</div>
                <div className="text-xl font-bold text-gray-800">{num(tableStats?.total || 0)}</div>
                <div className="text-xs text-gray-400">
                  {tableTotal} record{tableTotal !== 1 ? 's' : ''}
                </div>
              </div>
              <button
                onClick={() => {
                  setLoanDateFrom('');
                  setLoanDateTo('');
                }}
                className="text-sm text-gray-500 hover:text-gray-700 underline mb-2"
              >
                Clear
              </button>
            </>
          )}
        </div>
      )}

      {activeTab === 'loans' && loanSemesterStats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6 no-print">
          {loanSemesterStats.map((s) => (
            <div key={s.semester} className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-purple-500">
              <div className="text-xs font-bold text-gray-500 uppercase truncate">{s.semester}</div>
              <div className="text-xl font-bold text-gray-800">{num(s.total)}</div>
              <div className="text-xs text-gray-400 mt-1">
                {s.count} record{s.count !== 1 ? 's' : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 uppercase font-bold text-xs border-b border-gray-200">
              <tr>
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={tableRows.length > 0 && selected.size === tableRows.length}
                    className="rounded"
                  />
                </th>
                {getHeaders(activeTab).map((h) => (
                  <th
                    key={h}
                    className="p-4 cursor-pointer select-none hover:bg-gray-100"
                    onClick={() => handleSort(h)}
                  >
                    {h.replace(/_/g, ' ')}
                    {sortConfig.key === h && (sortConfig.direction === 'asc' ? ' ▲' : ' ▼')}
                  </th>
                ))}
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isFetching && tableRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-blue-500 font-bold">
                    <i className="fas fa-circle-notch fa-spin mr-2"></i> Loading data from server...
                  </td>
                </tr>
              ) : tableRows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-gray-400">
                    No records found.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, idx) => {
                  const rowId = item.id || item.reg_no || idx;
                  return (
                    <tr
                      key={String(rowId)}
                      className={`hover:bg-gray-50 transition ${selected.has(rowId) ? 'bg-blue-50' : ''}`}
                    >
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selected.has(rowId)}
                          onChange={() => handleSelectRow(rowId)}
                          className="rounded"
                        />
                      </td>
                      {renderRowCells(item)}
                      <td className="p-4 text-center flex justify-center gap-2">
                        <button
                          onClick={() => openModal(activeTab, item)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <i className="fas fa-edit"></i> Edit
                        </button>
                        {activeTab === 'payments' && norm(item.bank) === 'loan' ? (
                          <span
                            className="p-2 text-gray-300 cursor-not-allowed"
                            title='Loan-sourced — delete from the "Other Bank" tab'
                          >
                            <Trash2 className="h-4 w-4" />
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDelete(activeTab, item.id || item.reg_no!)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="bg-gray-50 p-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
            <span className="text-sm text-gray-600 font-medium">
              Showing{' '}
              <span className="font-bold text-gray-900">
                {tableTotal === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}
              </span>{' '}
              to{' '}
              <span className="font-bold text-gray-900">
                {Math.min(currentPage * ITEMS_PER_PAGE, tableTotal)}
              </span>{' '}
              of <span className="font-bold text-gray-900">{tableTotal}</span> Records
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <span className="text-sm font-bold bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
