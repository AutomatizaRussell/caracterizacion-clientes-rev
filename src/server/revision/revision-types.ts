export type ReviewLevel = 'STAFF' | 'SENIOR' | 'ADMIN';
export type MatchStatus = 'UNMATCHED' | 'SUGGESTED_BY_AI' | 'CONFIRMED_BY_USER' | 'MANUALLY_MATCHED' | 'REJECTED_MATCH' | 'IGNORED';
export type MatchSource = 'AI' | 'MANUAL' | 'SYSTEM';
export type ItemReviewStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

export function normalizeRole(value?: string | null) {
  return String(value ?? '').trim().toLowerCase();
}

export function getReviewLevelForRole(roleValue?: string | null): ReviewLevel | null {
  const role = normalizeRole(roleValue);

  if (role === 'admin') return 'ADMIN';
  if (role === 'senior') return 'SENIOR';
  if (role === 'staff' || role === 'asistente') return 'STAFF';

  return null;
}
