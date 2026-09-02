import { BookOpen, CloudUpload, Download, Key, LogOut } from '../icons';
import type { FeeAppState } from '../../hooks/useFeeApp';

interface SidebarProps {
  app: FeeAppState;
}

export function Sidebar({ app }: SidebarProps) {
  const {
    user,
    activeTab,
    setActiveTab,
    isFetching,
    availableTabs,
    meta,
    tableTotal,
    sidebarOpen,
    handleFullBackup,
    syncBrowserDataToDb,
    setShowPasswordModal,
    handleLogout,
  } = app;

  if (!user) return null;

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl border-r border-gray-200 h-full flex flex-col no-print transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="p-6 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-600 text-white p-2 rounded-lg shadow-sm">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">
              Fee Manager
              {isFetching && <i className="fas fa-circle-notch fa-spin text-blue-500 ml-2 text-sm"></i>}
            </h1>
            <p className="text-xs text-gray-500 font-medium">SCS & Finance</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-sm font-bold text-gray-800">{user.username}</div>
          <div className="text-xs text-gray-500 uppercase tracking-wide bg-gray-200 px-2 py-0.5 rounded w-fit">
            {user.role}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {availableTabs.map((tab) => (
            <div key={tab.id}>
              <button
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 border border-blue-100 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`}>
                    <tab.icon className="h-5 w-5" />
                  </div>
                  {tab.label}
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    activeTab === tab.id ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {tab.id === 'clearance'
                    ? '-'
                    : tab.id === 'summary'
                      ? meta.counts?.enrollments || '-'
                      : (meta.counts?.[tab.id] ?? (activeTab === tab.id ? tableTotal : '-'))}
                </span>
              </button>
            </div>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-2">
        <button
          onClick={handleFullBackup}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition shadow-sm"
          title="Download Full Excel Backup"
        >
          <Download className="h-4 w-4" /> Full Backup (Excel)
        </button>
        <button
          onClick={syncBrowserDataToDb}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition shadow-sm"
          title="Sync Data"
        >
          <CloudUpload className="h-4 w-4" /> Sync Data
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100 transition shadow-sm"
          >
            <Key className="h-3 w-3" /> Password
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-600 hover:bg-red-100 transition shadow-sm"
          >
            <LogOut className="h-3 w-3" /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}
