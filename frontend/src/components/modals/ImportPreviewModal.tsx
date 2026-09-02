import type { ImportPreview } from '../../types';

interface ImportPreviewModalProps {
  importPreview: ImportPreview;
  setImportPreview: (preview: ImportPreview) => void;
  onConfirm: () => void;
}

export function ImportPreviewModal({ importPreview, setImportPreview, onConfirm }: ImportPreviewModalProps) {
  const updateCount = (importPreview.updates || []).length;
  const importCount = importPreview.newItems.length + updateCount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] flex flex-col">
        <h3 className="text-xl font-bold mb-4">Import Summary ({importPreview.type})</h3>
        <div className={`grid ${updateCount > 0 ? 'grid-cols-4' : 'grid-cols-3'} gap-4 mb-4 text-center`}>
          <div className="bg-blue-50 p-2 rounded">
            <div className="text-xl font-bold text-blue-600">{importPreview.total}</div>
            <div className="text-xs text-gray-500">Total Found</div>
          </div>
          <div className="bg-green-50 p-2 rounded">
            <div className="text-xl font-bold text-green-600">{importPreview.newItems.length}</div>
            <div className="text-xs text-gray-500">New Records</div>
          </div>
          {updateCount > 0 && (
            <div className="bg-purple-50 p-2 rounded">
              <div className="text-xl font-bold text-purple-600">{updateCount}</div>
              <div className="text-xs text-gray-500">Existing (Update)</div>
            </div>
          )}
          <div className="bg-red-50 p-2 rounded">
            <div className="text-xl font-bold text-red-600">{importPreview.duplicates.length}</div>
            <div className="text-xs text-gray-500">Duplicates (Skipped)</div>
          </div>
        </div>

        {updateCount > 0 && (
          <div className="flex-1 overflow-hidden flex flex-col mb-4">
            <h4 className="font-bold text-sm text-gray-700 mb-2">
              Existing students to update (mobile/email/total package):
            </h4>
            <div className="overflow-y-auto border rounded bg-gray-50 p-2 text-sm text-gray-600 space-y-1 max-h-32">
              {importPreview.updates.map((d, i) => (
                <div key={i} className="flex justify-between border-b border-gray-200 last:border-0 pb-1">
                  <span>
                    {String(d.reg_no || 'Unknown')} — {String(d.name)}
                  </span>
                  <span className="text-xs bg-gray-200 px-2 rounded text-gray-500">
                    {[d.mobile, d.email, d.total_package].filter(Boolean).join(' / ') || 'no change'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {importPreview.duplicates.length > 0 && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <h4 className="font-bold text-sm text-gray-700 mb-2">Duplicate Entries:</h4>
            <div className="overflow-y-auto border rounded bg-gray-50 p-2 text-sm text-gray-600 space-y-1">
              {importPreview.duplicates.map((d, i) => (
                <div key={i} className="flex justify-between border-b border-gray-200 last:border-0 pb-1">
                  <span>{String(d.reg_no || d.name || 'Unknown')}</span>
                  <span className="text-xs bg-gray-200 px-2 rounded text-gray-500">
                    {String(d.semester || d.term || 'N/A')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            onClick={() =>
              setImportPreview({ show: false, newItems: [], duplicates: [], updates: [], total: 0, type: '' })
            }
            className="px-4 py-2 bg-gray-100 rounded font-bold hover:bg-gray-200"
          >
            Cancel
          </button>
          {importCount > 0 && (
            <button onClick={onConfirm} className="px-6 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">
              Import {importCount} Records
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
