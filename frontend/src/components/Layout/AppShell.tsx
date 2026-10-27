import { useState } from 'react';
import { Menu } from '../icons';
import { ClearanceTab } from '../tabs/ClearanceTab';
import { DataDirectoryTab } from '../tabs/DataDirectoryTab';
import { SettingsTab } from '../tabs/SettingsTab';
import { SummaryTab } from '../tabs/SummaryTab';
import { ImportPreviewModal } from '../modals/ImportPreviewModal';
import { PasswordModal } from '../modals/PasswordModal';
import { RecordModal } from '../modals/RecordModal';
import { SessionDetailModal } from '../modals/SessionDetailModal';
import { Sidebar } from './Sidebar';
import type { FeeAppState } from '../../hooks/useFeeApp';
import { TAB_TABLES } from '../../utils/constants';

interface AppShellProps {
  app: FeeAppState;
}

export function AppShell({ app }: AppShellProps) {
  const {
    user,
    activeTab,
    setSidebarOpen,
    showModal,
    showPasswordModal,
    setShowPasswordModal,
    passwordData,
    setPasswordData,
    handleChangePassword,
    importPreview,
    setImportPreview,
    confirmImport,
    uploadStatus,
    sessionDetail,
    setSessionDetail,
    exportSessionDetailExcel,
    exportSessionDetailCsv,
    num,
    meta,
  } = app;

  const [warningsDismissed, setWarningsDismissed] = useState(false);

  if (!user) return null;

  const schemaWarnings = user.role === 'admin' ? meta.schemaWarnings || [] : [];

  const isDataTab = activeTab !== 'clearance' && activeTab !== 'summary' && activeTab !== 'settings';
  const isTableTab = TAB_TABLES.has(activeTab) && activeTab !== 'settings';

  return (
    <div className="flex h-screen bg-gray-100 font-sans text-gray-800 overflow-hidden">
      <Sidebar app={app} />

      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        <div className="md:hidden bg-white border-b p-4 flex items-center justify-between no-print">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600 rounded-lg hover:bg-gray-100">
            <Menu className="h-6 w-6" />
          </button>
          <span className="font-bold text-gray-700">Student Fee System</span>
          <div className="w-10"></div>
        </div>

        {schemaWarnings.length > 0 && !warningsDismissed && (
          <div className="no-print bg-amber-50 border-b border-amber-200 px-4 py-3 text-sm text-amber-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-bold">
                  {schemaWarnings.length} database {schemaWarnings.length === 1 ? 'update' : 'updates'} didn't apply automatically
                </p>
                <p className="mt-1">
                  Some newer fields won't show any data until these run — most likely the database user doesn't
                  have ALTER permission. Ask your hosting provider (or run via phpMyAdmin) to execute:
                </p>
                <pre className="mt-2 bg-white border border-amber-200 rounded p-2 text-xs overflow-x-auto whitespace-pre-wrap">
                  {schemaWarnings.join('\n')}
                </pre>
              </div>
              <button
                onClick={() => setWarningsDismissed(true)}
                className="text-amber-700 hover:text-amber-900 font-bold flex-shrink-0"
                title="Dismiss for this session"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-8" id="main-content">
          {activeTab === 'clearance' && <ClearanceTab app={app} />}
          {activeTab === 'summary' && <SummaryTab app={app} />}
          {activeTab === 'settings' && <SettingsTab app={app} />}
          {isDataTab && isTableTab && <DataDirectoryTab app={app} />}
        </div>
      </div>

      {sessionDetail && (
        <SessionDetailModal
          sessionDetail={sessionDetail}
          onClose={() => setSessionDetail(null)}
          onExportExcel={() => exportSessionDetailExcel(sessionDetail)}
          onExportCsv={() => exportSessionDetailCsv(sessionDetail)}
          num={num}
        />
      )}

      {showModal && <RecordModal app={app} />}

      {showPasswordModal && (
        <PasswordModal
          passwordData={passwordData}
          setPasswordData={setPasswordData}
          onClose={() => {
            setShowPasswordModal(false);
            setPasswordData({ current: '', new: '', confirm: '' });
          }}
          onSubmit={handleChangePassword}
        />
      )}

      {uploadStatus.active && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[110] flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-xl w-80 text-center">
            <h3 className="font-bold text-lg mb-2">Importing Data...</h3>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${(uploadStatus.current / uploadStatus.total) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600">
              {uploadStatus.current} / {uploadStatus.total}
            </p>
          </div>
        </div>
      )}

      {importPreview.show && (
        <ImportPreviewModal importPreview={importPreview} setImportPreview={setImportPreview} onConfirm={confirmImport} />
      )}
    </div>
  );
}
