const canonicalize = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, '');

// Directional aliases: key is the requested page key, values are accepted legacy/alternate permission keys.
const TARGET_PERMISSION_ALIASES: Record<string, string[]> = {
  bookingcalender: ['bookingcalendar'],
  bookingcalendar: ['bookingcalender'],
  customerchats: ['customerchat', 'messages'],
  customerchat: ['customerchats', 'messages'],
  feedbacks: ['feedback'],
  feedback: ['feedbacks'],
};

export const hasPagePermission = (allowedPages: string[] | undefined, pageKey: string): boolean => {
  if (!pageKey) return true;

  const normalizedAllowed = new Set((allowedPages || []).map(canonicalize));
  const normalizedTarget = canonicalize(pageKey);
  const acceptedKeys = [
    normalizedTarget,
    ...(TARGET_PERMISSION_ALIASES[normalizedTarget] || []),
  ];

  return acceptedKeys.some((key) => normalizedAllowed.has(key));
};
