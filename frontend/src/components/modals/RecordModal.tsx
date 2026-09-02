import { TABS } from '../../utils/constants';
import type { FeeAppState } from '../../hooks/useFeeApp';

interface RecordModalProps {
  app: FeeAppState;
}

export function RecordModal({ app }: RecordModalProps) {
  const {
    modalType,
    formData,
    setFormData,
    editingId,
    handleSave,
    handleRegChange,
    setShowModal,
    data,
    togglePermission,
    norm,
  } = app;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4 capitalize">Add/Edit {modalType.slice(0, -1)}</h3>
        <form onSubmit={handleSave} className="space-y-4">
          {modalType === 'students' && (
            <>
              <input
                required
                placeholder="Registration No"
                className="w-full border p-2 rounded"
                value={String(formData.reg_no || '')}
                onChange={handleRegChange}
              />
              <input
                required
                placeholder="Full Name"
                className="w-full border p-2 rounded"
                value={String(formData.name || '')}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  placeholder="Degree (e.g. BSCAF)"
                  className="w-full border p-2 rounded"
                  value={String(formData.degree || '')}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                />
                <input
                  placeholder="Batch (e.g. Fall 2023)"
                  className="w-full border p-2 rounded"
                  value={String(formData.batch || '')}
                  onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  placeholder="Mobile #"
                  className="w-full border p-2 rounded"
                  value={String(formData.mobile || '')}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                />
                <input
                  placeholder="Email (Optional)"
                  className="w-full border p-2 rounded"
                  value={String(formData.email || '')}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <input
                type="number"
                placeholder="Total Package Amount (Optional)"
                className="w-full border p-2 rounded"
                value={String(formData.total_package || '')}
                onChange={(e) => setFormData({ ...formData, total_package: e.target.value })}
              />
            </>
          )}

          {modalType === 'fees' && (
            <>
              <div className="bg-blue-50 p-3 rounded text-xs text-blue-800 mb-2">
                <strong>Note:</strong> Fee Structure applies to ALL semesters for this Degree & Batch.
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  required
                  placeholder="Degree"
                  className="w-full border p-2 rounded"
                  value={String(formData.degree || '')}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                />
                <input
                  required
                  placeholder="Batch"
                  className="w-full border p-2 rounded"
                  value={String(formData.batch || '')}
                  onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Fee Per Credit Hour"
                  className="w-full border p-2 rounded"
                  value={String(formData.per_cr_fee || '')}
                  onChange={(e) => setFormData({ ...formData, per_cr_fee: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Fee Per Subject/Course"
                  className="w-full border p-2 rounded"
                  value={String(formData.per_course_fee || '')}
                  onChange={(e) => setFormData({ ...formData, per_course_fee: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Registration Fee (Semester)"
                  className="w-full border p-2 rounded"
                  value={String(formData.reg_fee || '')}
                  onChange={(e) => setFormData({ ...formData, reg_fee: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Other Charges (Semester)"
                  className="w-full border p-2 rounded"
                  value={String(formData.other_fee || '')}
                  onChange={(e) => setFormData({ ...formData, other_fee: e.target.value })}
                />
              </div>
            </>
          )}

          {modalType === 'enrollments' && (
            <>
              <input
                required
                placeholder="Registration No"
                className="w-full border p-2 rounded"
                value={String(formData.reg_no || '')}
                onChange={handleRegChange}
              />
              <input
                placeholder="Student Name"
                className="w-full border p-2 rounded bg-gray-50 font-bold text-gray-700"
                value={String(formData.name || '')}
                readOnly
              />
              <input
                required
                placeholder="Semester (e.g. Spring 2024)"
                className="w-full border p-2 rounded"
                value={String(formData.semester || '')}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Credit Hours"
                  className="w-full border p-2 rounded"
                  value={String(formData.cr || '')}
                  onChange={(e) => setFormData({ ...formData, cr: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="No. of Courses"
                  className="w-full border p-2 rounded"
                  value={String(formData.courses || '')}
                  onChange={(e) => setFormData({ ...formData, courses: e.target.value })}
                />
              </div>
            </>
          )}

          {modalType === 'payments' && (
            <>
              <input
                required
                placeholder="Registration No"
                className="w-full border p-2 rounded"
                value={String(formData.reg_no || '')}
                onChange={handleRegChange}
              />
              <input
                placeholder="Student Name"
                className="w-full border p-2 rounded bg-gray-50 font-bold text-gray-700"
                value={String(formData.name || '')}
                readOnly
              />
              <input
                required
                placeholder="Semester (e.g. Spring 2024)"
                className="w-full border p-2 rounded"
                value={String(formData.semester || '')}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
              />
              <input
                required
                type="number"
                placeholder="Amount Paid"
                className="w-full border p-2 rounded font-bold text-lg"
                value={String(formData.amount || '')}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
              <input
                type="date"
                className="w-full border p-2 rounded"
                value={String(formData.date || '')}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
              <label className="block text-sm font-bold text-gray-700 mt-2 mb-1">Payment Through (Bank)</label>
              <select
                className="w-full border p-2 rounded bg-white"
                value={String(formData.bank || '')}
                onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
              >
                <option value="">Select Bank</option>
                <option value="Cash">Cash</option>
                {data.banks.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </>
          )}

          {modalType === 'loans' && (
            <>
              <input
                required
                placeholder="Registration No"
                className="w-full border p-2 rounded"
                value={String(formData.reg_no || '')}
                onChange={handleRegChange}
              />
              <input
                placeholder="Student Name"
                className="w-full border p-2 rounded bg-gray-50 font-bold text-gray-700"
                value={String(formData.name || '')}
                readOnly
              />
              <input
                required
                placeholder="Semester (e.g. Spring 2024)"
                className="w-full border p-2 rounded"
                value={String(formData.semester || '')}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
              />
              <input
                required
                type="number"
                placeholder="Loan Amount"
                className="w-full border p-2 rounded font-bold text-lg"
                value={String(formData.amount || '')}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
              <input
                type="date"
                className="w-full border p-2 rounded"
                value={String(formData.date || '')}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
              <div className="bg-purple-50 border border-purple-200 text-purple-800 text-xs p-2 rounded">
                This is recorded as a payment (source: <strong>Loan</strong>) and will reduce the student's
                outstanding balance for this semester on the Clearance report and Payments tab.
              </div>
            </>
          )}

          {modalType === 'others' && (
            <>
              <input
                placeholder="Registration No (leave blank for a Gap Fee applied to everyone not enrolled this term)"
                className="w-full border p-2 rounded"
                value={String(formData.reg_no || '')}
                onChange={handleRegChange}
              />
              <input
                placeholder="Student Name"
                className="w-full border p-2 rounded bg-gray-50 font-bold text-gray-700"
                value={String(formData.name || '')}
                readOnly
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  required
                  placeholder="Semester"
                  className="w-full border p-2 rounded"
                  value={String(formData.semester || '')}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                />
                <input
                  required
                  placeholder="Fee Head (e.g. Fine, Gap Fee)"
                  className="w-full border p-2 rounded"
                  value={String(formData.fee_name || '')}
                  onChange={(e) => setFormData({ ...formData, fee_name: e.target.value })}
                />
              </div>
              <input
                required
                type="number"
                placeholder="Amount"
                className="w-full border p-2 rounded font-bold text-lg"
                value={String(formData.amount || '')}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
              {norm(formData.fee_name).includes('gap') && (
                <div className="bg-orange-50 border border-orange-200 text-orange-800 text-xs p-2 rounded">
                  Fee Head contains "Gap": this will show up on the Clearance report for "
                  {String(formData.semester || '...')}" even though there's no enrollment record for that term —{' '}
                  {formData.reg_no ? (
                    <>
                      charged only to <strong>{String(formData.reg_no)}</strong>
                    </>
                  ) : (
                    <>
                      charged to <strong>every student</strong> with no enrollment that term
                    </>
                  )}
                  .
                </div>
              )}
            </>
          )}

          {modalType === 'discounts' && (
            <>
              <input
                required
                placeholder="Registration No"
                className="w-full border p-2 rounded"
                value={String(formData.reg_no || '')}
                onChange={handleRegChange}
              />
              <input
                placeholder="Student Name"
                className="w-full border p-2 rounded bg-gray-50 font-bold text-gray-700"
                value={String(formData.name || '')}
                readOnly
              />
              <input
                required
                placeholder="Term"
                className="w-full border p-2 rounded"
                value={String(formData.term || '')}
                onChange={(e) => setFormData({ ...formData, term: e.target.value })}
              />
              <input
                required
                type="number"
                placeholder="Discount %"
                className="w-full border p-2 rounded"
                value={String(formData.discount || '')}
                onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
              />
            </>
          )}

          {modalType === 'banks' && (
            <>
              <input
                required
                placeholder="Bank Name"
                className="w-full border p-2 rounded"
                value={String(formData.name || '')}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <input
                placeholder="Account Number (Optional)"
                className="w-full border p-2 rounded"
                value={String(formData.account_no || '')}
                onChange={(e) => setFormData({ ...formData, account_no: e.target.value })}
              />
            </>
          )}

          {modalType === 'users' && (
            <div className="space-y-4">
              <input
                required
                placeholder="Username"
                className="w-full border p-2 rounded"
                value={String(formData.username || '')}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
              <input
                required={!editingId}
                type="password"
                placeholder={editingId ? 'New Password (leave blank to keep current)' : 'Password'}
                className="w-full border p-2 rounded"
                value={String(formData.password || '')}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <select
                className="w-full border p-2 rounded bg-white"
                value={String(formData.role || 'user')}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="user">Regular User</option>
                <option value="admin">Administrator</option>
              </select>
              {formData.role !== 'admin' && (
                <div className="bg-gray-50 p-3 rounded border">
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Tab Access Permissions</label>
                  <div className="grid grid-cols-2 gap-2">
                    {TABS.map((t) => (
                      <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={((formData.permissions as string[]) || []).includes(t.id)}
                          onChange={() => togglePermission(t.id)}
                        />
                        {t.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 font-bold"
            >
              Cancel
            </button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold">
              Save Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
