// Response deadlines for data-subject requests. See docs/LGPD-PRAZOS.md for sources.
//
// ACCESS: LGPD art. 19, II sets 15 days for the clear and complete declaration.
//   Small processing agents may take 30 days (Res. CD/ANPD nº 2/2022, art. 14, III), but
//   only if the business qualifies (art. 3: no high-risk processing, revenue limits).
//   We keep 15 days until that qualification is confirmed by the owner's legal advisor.
// CORRECTION / DELETION: LGPD art. 18, §5 defers deadlines to an ANPD regulation that has
//   not been confirmed as published. 15 days is an internal target, not a legal term.
export const PRIVACY_DEADLINES = Object.freeze({
  ACCESS: { days: 15, basis: 'LGPD_ART_19_II' },
  CORRECTION: { days: 15, basis: 'INTERNAL_TARGET' },
  DELETION: { days: 15, basis: 'INTERNAL_TARGET' },
})

// Days before the deadline when the store receives a reminder.
export const PRIVACY_REMINDER_DAYS = 3
