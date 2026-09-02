import { DEFAULT_MESSAGE_TEMPLATE } from '../../utils/constants';
import type { FeeAppState } from '../../hooks/useFeeApp';

interface SettingsTabProps {
  app: FeeAppState;
}

export function SettingsTab({ app }: SettingsTabProps) {
  const { settingsForm, setSettingsForm, settingsSaving, saveSettings, wahaTesting, testWahaConnection } = app;

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Settings</h2>
      {!settingsForm ? (
        <p className="text-gray-500">Loading...</p>
      ) : (
        <form onSubmit={saveSettings} className="space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
            <h3 className="font-bold text-gray-700">Message Template</h3>
            <p className="text-xs text-gray-500">
              Used for both Email and WhatsApp sends. Placeholders: {'{name}'}, {'{reg_no}'}, {'{degree}'},{' '}
              {'{batch}'}, {'{scholarship}'}, {'{net_payable}'}, {'{from_name}'}. The full per-semester breakdown
              isn't included here — for email it's in the PDF attachment instead.
            </p>
            <textarea
              rows={8}
              className="w-full border p-2 rounded font-mono text-sm"
              value={settingsForm.message_template ?? DEFAULT_MESSAGE_TEMPLATE}
              onChange={(e) => setSettingsForm({ ...settingsForm, message_template: e.target.value })}
            ></textarea>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
            <h3 className="font-bold text-gray-700">WhatsApp (WAHA)</h3>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">WAHA Base URL</label>
              <input
                placeholder="https://your-waha-server.example.com:3000"
                className="w-full border p-2 rounded"
                value={settingsForm.waha_url || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, waha_url: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Use the server root only (no <code>/api</code> suffix). If you see error 522, WAHA is unreachable from
                this web server — check it is running and not blocked by Cloudflare/firewall.
              </p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Session Name</label>
              <input
                placeholder="default"
                className="w-full border p-2 rounded"
                value={settingsForm.waha_session || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, waha_session: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                API Key{' '}
                {settingsForm.has_waha_api_key && (
                  <span className="text-green-600 font-normal">(already set — leave blank to keep it)</span>
                )}
              </label>
              <input
                type="password"
                placeholder={settingsForm.has_waha_api_key ? '••••••••' : ''}
                className="w-full border p-2 rounded"
                value={settingsForm.waha_api_key || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, waha_api_key: e.target.value })}
              />
            </div>
            <button
              type="button"
              onClick={testWahaConnection}
              disabled={wahaTesting}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50"
            >
              {wahaTesting ? 'Testing...' : 'Test WAHA Connection'}
            </button>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
            <h3 className="font-bold text-gray-700">Email — Gmail API (Google Workspace)</h3>
            <p className="text-xs text-gray-500">
              Sends via the Gmail API over HTTPS using a Google Workspace service account — not affected by a host
              blocking outbound SMTP ports. Used automatically whenever both fields below are set, ahead of
              Brevo/SMTP. Requires one-time setup in Google Cloud + your Workspace Admin console (domain-wide
              delegation) — ask if you need the exact steps.
            </p>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Send As (Workspace email)</label>
              <input
                placeholder="accounts@uolcc.edu.pk"
                className="w-full border p-2 rounded"
                value={settingsForm.google_delegated_user || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, google_delegated_user: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Service Account JSON Key{' '}
                {settingsForm.has_google_service_account && (
                  <span className="text-green-600 font-normal">(already set — leave blank to keep it)</span>
                )}
              </label>
              <textarea
                rows={4}
                placeholder={
                  settingsForm.has_google_service_account
                    ? 'Already saved — paste a new key only to replace it'
                    : 'Paste the full contents of the downloaded service-account-key.json file here'
                }
                className="w-full border p-2 rounded font-mono text-xs"
                value={settingsForm.google_service_account_json || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, google_service_account_json: e.target.value })}
              ></textarea>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
            <h3 className="font-bold text-gray-700">Email — Brevo API</h3>
            <p className="text-xs text-gray-500">
              Sends over HTTPS instead of raw SMTP. Used automatically if Gmail API above isn't configured. Uses the
              From Email/Name entered below. Get a free API key at brevo.com.
            </p>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Brevo API Key{' '}
                {settingsForm.has_brevo_api_key && (
                  <span className="text-green-600 font-normal">(already set — leave blank to keep it)</span>
                )}
              </label>
              <input
                type="password"
                placeholder={settingsForm.has_brevo_api_key ? '••••••••' : ''}
                className="w-full border p-2 rounded"
                value={settingsForm.brevo_api_key || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, brevo_api_key: e.target.value })}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
            <h3 className="font-bold text-gray-700">
              Email — SMTP (fallback, used only if neither Gmail API nor Brevo is set above)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">SMTP Host</label>
                <input
                  placeholder="smtp.example.com"
                  className="w-full border p-2 rounded"
                  value={settingsForm.smtp_host || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, smtp_host: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Port</label>
                <input
                  type="number"
                  placeholder="587"
                  className="w-full border p-2 rounded"
                  value={settingsForm.smtp_port || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, smtp_port: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Username</label>
              <input
                className="w-full border p-2 rounded"
                value={settingsForm.smtp_username || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, smtp_username: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Password{' '}
                {settingsForm.has_smtp_password && (
                  <span className="text-green-600 font-normal">(already set — leave blank to keep it)</span>
                )}
              </label>
              <input
                type="password"
                placeholder={settingsForm.has_smtp_password ? '••••••••' : ''}
                className="w-full border p-2 rounded"
                value={settingsForm.smtp_password || ''}
                onChange={(e) => setSettingsForm({ ...settingsForm, smtp_password: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">From Email</label>
                <input
                  className="w-full border p-2 rounded"
                  value={settingsForm.smtp_from_email || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, smtp_from_email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">From Name</label>
                <input
                  className="w-full border p-2 rounded"
                  value={settingsForm.smtp_from_name || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, smtp_from_name: e.target.value })}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={settingsSaving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
          >
            {settingsSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      )}
    </div>
  );
}
