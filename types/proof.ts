export interface SkillProfile {
  userId: string;
  headline: string;
  bio: string;
  isPublic: boolean;
  shareSlug: string | null;
  updatedAt: string;
}

export interface VerifiedAssessment {
  id: string;
  userId: string;
  assessmentId: string | null;
  skillId: string;
  score: number;
  verificationCode: string;
  verifiedAt: string;
  revokedAt: string | null;
}

export type EvidenceType = 'assessment' | 'course' | 'dsa' | 'project' | 'certificate';

export interface SkillEvidence {
  id: string;
  userId: string;
  skillId: string;
  evidenceType: EvidenceType;
  entityId: string | null;
  score: number | null;
  verified: boolean;
  createdAt: string;
}

export interface PublicSkillProfile {
  userId: string;
  shareSlug: string;
  enabled: boolean;
  displayName: string;
  headline: string;
  generatedAt: string;
}

// Public-safe view of a skill for sharing
export interface PublicSkillView {
  name: string;
  slug: string;
  category: string;
  masteryScore: number;
  confidenceScore: number;
  evidenceCount: number;
}

// Public-safe view of a verified assessment
export interface PublicVerifiedAssessment {
  verificationCode: string;
  skillName: string;
  score: number;
  verifiedAt: string;
  revoked: boolean;
}

// Public-safe view of a certificate
export interface PublicCertificate {
  certificateCode: string;
  courseTitle: string;
  score: number;
  issuedAt: string;
  revoked: boolean;
}

// Full public proof profile
export interface PublicProofProfile {
  displayName: string;
  headline: string;
  skills: PublicSkillView[];
  verifiedAssessments: PublicVerifiedAssessment[];
  certificates: PublicCertificate[];
  totalEvidence: number;
  generatedAt: string;
}

// Verification result
export interface VerificationResult {
  valid: boolean;
  type: 'certificate' | 'assessment';
  code: string;
  learnerName: string;
  title: string;
  score: number;
  verifiedAt: string;
  revoked: boolean;
}
