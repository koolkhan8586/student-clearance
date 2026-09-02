export const norm = (str: unknown): string =>
  str ? str.toString().toLowerCase().replace(/[^a-z0-9]/g, '') : '';

export const canonicalReg = (str: unknown): string =>
  str ? str.toString().toUpperCase().replace(/[^A-Z0-9]/g, '') : '';

/** Degree prefix before the first batch code "05" (e.g. BSCAF052430051 → BSCAF). */
export const parseDegreeFromReg = (regNo: unknown): string => {
  const canonical = canonicalReg(regNo);
  const pos = canonical.indexOf('05');
  if (pos <= 0) return '';
  return canonical.slice(0, pos);
};

/** Legacy index.html correctedStudents: degree always follows reg_no prefix. */
export const syncDegreeFromReg = <T extends { reg_no?: string; degree?: string }>(student: T): T => {
  const degree = parseDegreeFromReg(student.reg_no);
  if (degree && student.degree !== degree) {
    return { ...student, degree };
  }
  return student;
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
