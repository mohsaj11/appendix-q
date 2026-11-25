export type Status = 'accepted' | 'not-accepted' | 'pending'

/** One Appendix Q submission, read from a workbook's Cover Sheet. */
export interface Submission {
  id: string
  fileName: string
  importedAt: string
  /** Enterprise Partner (contractor) name. */
  contractor: string
  /** Package / project name. */
  project: string
  /** Reporting month as YYYY-MM. */
  month: string
  status: Status
  /** The acceptance outcome text as ticked on the Cover Sheet. */
  outcome: string
  /** Outcome for Review & Assurance checks, if given. */
  assuranceOutcome: string
  /** NEC4 clause 31.3 reasons ticked for non-acceptance. */
  nec4Reasons: string[]
  /** Free text after "Not Accepted - reasons given:". */
  reasonsGiven: string
  /** Numbered key points from the Comments box. */
  keyPoints: string[]
  submissionReference: string
  submissionDate: string
  reviewedBy: string
  /** Problems found while reading the file, shown so the user can fix them. */
  warnings: string[]
}
