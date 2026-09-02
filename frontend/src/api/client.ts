export const API_URL = 'api.php';

export interface FetchOptions {
  credentials?: RequestCredentials;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
}

export async function apiFetch(url: string, options: FetchOptions = {}): Promise<Response> {
  return fetch(url, {
    credentials: 'same-origin',
    ...options,
  });
}

export async function apiGet(): Promise<Response> {
  return apiFetch(API_URL);
}

export async function apiPost(action: string, payload: Record<string, unknown> = {}): Promise<Response> {
  return apiFetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  });
}

export async function apiPostJson<T = Record<string, unknown>>(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<T> {
  const res = await apiPost(action, payload);
  return res.json() as Promise<T>;
}

export async function loginRequest(username: string, password: string) {
  return apiPost('login', { data: { username, password } });
}

export async function logoutRequest() {
  return apiPost('logout');
}

export async function changePasswordRequest(current: string, newPassword: string) {
  return apiPost('change_password', { data: { current, new: newPassword } });
}

export async function loadMetaRequest() {
  return apiGet();
}

export async function fetchTableRequest(data: Record<string, unknown>) {
  return apiPost('fetch_table', { data });
}

export async function getSummaryRequest(filterSession: string) {
  return apiPost('get_summary', { data: { filter_session: filterSession } });
}

export async function getClearanceRequest(regNo: string, filterSession: string) {
  return apiPost('get_clearance', { data: { reg_no: regNo, filter_session: filterSession } });
}

export async function lookupStudentRequest(regNo: string) {
  return apiPost('lookup_student', { data: { reg_no: regNo } });
}

export async function getSettingsRequest() {
  return apiPost('get_settings');
}

export async function exportAllRequest() {
  return apiPost('export_all');
}

export async function getImportIndexRequest(type: string) {
  return apiPost('get_import_index', { data: { type } });
}
