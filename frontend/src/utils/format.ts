export const norm = (str: unknown): string =>
  str ? str.toString().toLowerCase().replace(/[^a-z0-9]/g, '') : '';

export const canonicalReg = (str: unknown): string =>
  str ? str.toString().toUpperCase().replace(/[^A-Z0-9]/g, '') : '';

/** Degree prefix before batch code "05" — BSCAF and BAF are distinct. */
export const parseDegreeFromReg = (regNo: unknown): string => {
  const canonical = canonicalReg(regNo);
  const match = canonical.match(/^([A-Z0-9]+)05/);
  return match ? match[1] : '';
};

export const num = (n: unknown): string =>
  parseFloat(String(n || 0)).toLocaleString('en-US');

export const getTermRank = (sem: string | undefined): number => {
  const s = (sem || '').toLowerCase();
  if (s.includes('fall')) return 1;
  if (s.includes('spring')) return 2;
  if (s.includes('summer')) return 3;
  return 4;
};
