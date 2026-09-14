import 'server-only';

import { randomBytes } from 'crypto';

import { createAdminSupabaseClient } from '@/services/supabase-admin';
import { createServerSupabaseClient } from '@/services/supabase-server';
import { getUserSkillProfile } from '@/services/skills';
import type {
  SkillProfile,
  PublicProofProfile,
  PublicSkillView,
  PublicVerifiedAssessment,
  PublicCertificate,
  VerificationResult,
} from '@/types/proof';

function generateVerificationCode(): string {
  return `DS-${randomBytes(12).toString('hex').toUpperCase()}`;
}

function generateShareSlug(): string {
  return randomBytes(8).toString('hex');
}

export async function getSkillProfile(userId: string): Promise<SkillProfile | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('skill_profiles')
    .select('user_id, headline, bio, is_public, share_slug, updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    userId: data.user_id,
    headline: data.headline,
    bio: data.bio,
    isPublic: data.is_public,
    shareSlug: data.share_slug,
    updatedAt: data.updated_at,
  };
}

export async function upsertSkillProfile(userId: string, updates: {
  headline?: string;
  bio?: string;
  isPublic?: boolean;
}): Promise<SkillProfile> {
  const admin = createAdminSupabaseClient();
  const existing = await admin.from('skill_profiles').select('share_slug').eq('user_id', userId).maybeSingle();
  const shareSlug = existing.data?.share_slug ?? generateShareSlug();

  const { data, error } = await admin
    .from('skill_profiles')
    .upsert({
      user_id: userId,
      headline: updates.headline ?? '',
      bio: updates.bio ?? '',
      is_public: updates.isPublic ?? false,
      share_slug: shareSlug,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select('user_id, headline, bio, is_public, share_slug, updated_at')
    .single();

  if (error) throw new Error(error.message);
  return {
    userId: data.user_id,
    headline: data.headline,
    bio: data.bio,
    isPublic: data.is_public,
    shareSlug: data.share_slug,
    updatedAt: data.updated_at,
  };
}

export async function createVerifiedAssessment(params: {
  userId: string;
  assessmentId?: string | null;
  skillId: string;
  score: number;
}): Promise<{ id: string; verificationCode: string }> {
  const admin = createAdminSupabaseClient();
  const verificationCode = generateVerificationCode();

  const { data, error } = await admin
    .from('verified_assessments')
    .insert({
      user_id: params.userId,
      assessment_id: params.assessmentId ?? null,
      skill_id: params.skillId,
      score: Math.max(0, Math.min(100, params.score)),
      verification_code: verificationCode,
      verified_at: new Date().toISOString(),
    })
    .select('id, verification_code')
    .single();

  if (error) throw new Error(error.message);
  return { id: data.id, verificationCode: data.verification_code };
}

export async function getPublicProofProfile(shareSlug: string): Promise<PublicProofProfile | null> {
  const supabase = await createServerSupabaseClient();

  const { data: pubProfile, error: pubError } = await supabase
    .from('skill_profiles')
    .select('user_id, share_slug, headline, is_public')
    .eq('share_slug', shareSlug)
    .eq('is_public', true)
    .maybeSingle();

  if (pubError || !pubProfile) return null;

  const userId = pubProfile.user_id;

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', userId)
    .maybeSingle();

  const displayName = profile?.name ?? 'Learner';

  const skillProfile = await getUserSkillProfile(userId);
  const skills: PublicSkillView[] = skillProfile.skills
    .filter((s) => s.mastery != null)
    .map((s) => ({
      name: s.skill.name,
      slug: s.skill.slug,
      category: s.skill.category,
      masteryScore: s.mastery?.masteryScore ?? 0,
      confidenceScore: s.mastery?.confidenceScore ?? 0,
      evidenceCount: s.mastery?.attempts ?? 0,
    }));

  const { data: verifiedAssessments } = await supabase
    .from('verified_assessments')
    .select('verification_code, skill_id, score, verified_at, revoked_at, skills(name)')
    .eq('user_id', userId)
    .order('verified_at', { ascending: false })
    .limit(20);

  const publicVerifiedAssessments: PublicVerifiedAssessment[] = (verifiedAssessments ?? []).map((va) => {
    const skillRel = va.skills as { name: string } | Array<{ name: string }> | null;
    const skill = Array.isArray(skillRel) ? skillRel[0] : skillRel;
    return {
      verificationCode: va.verification_code,
      skillName: skill?.name ?? 'Unknown Skill',
      score: va.score,
      verifiedAt: va.verified_at,
      revoked: va.revoked_at != null,
    };
  });

  const { data: certificates } = await supabase
    .from('certificates')
    .select('certificate_code, score, issued_at, revoked_at, courses(title)')
    .eq('user_id', userId)
    .order('issued_at', { ascending: false })
    .limit(20);

  const publicCertificates: PublicCertificate[] = (certificates ?? []).map((cert) => {
    const courseRel = cert.courses as { title: string } | Array<{ title: string }> | null;
    const course = Array.isArray(courseRel) ? courseRel[0] : courseRel;
    return {
      certificateCode: cert.certificate_code,
      courseTitle: course?.title ?? 'Unknown Course',
      score: cert.score,
      issuedAt: cert.issued_at,
      revoked: cert.revoked_at != null,
    };
  });

  const { count: evidenceCount } = await supabase
    .from('skill_evidence')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  return {
    displayName,
    headline: pubProfile.headline,
    skills,
    verifiedAssessments: publicVerifiedAssessments,
    certificates: publicCertificates,
    totalEvidence: evidenceCount ?? 0,
    generatedAt: new Date().toISOString(),
  };
}

export async function verifyByCode(code: string): Promise<VerificationResult | null> {
  const supabase = await createServerSupabaseClient();

  const { data: vaAssessment } = await supabase
    .from('verified_assessments')
    .select('verification_code, score, verified_at, revoked_at, user_id, skills(name)')
    .eq('verification_code', code)
    .maybeSingle();

  if (vaAssessment) {
    const skillRel = vaAssessment.skills as { name: string } | Array<{ name: string }> | null;
    const skill = Array.isArray(skillRel) ? skillRel[0] : skillRel;

    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', vaAssessment.user_id)
      .maybeSingle();

    return {
      valid: true,
      type: 'assessment',
      code: vaAssessment.verification_code,
      learnerName: profile?.name ?? 'Learner',
      title: skill?.name ?? 'Skill Assessment',
      score: vaAssessment.score,
      verifiedAt: vaAssessment.verified_at,
      revoked: vaAssessment.revoked_at != null,
    };
  }

  const { data: certificate } = await supabase
    .from('certificates')
    .select('certificate_code, score, issued_at, revoked_at, user_id, courses(title)')
    .eq('certificate_code', code)
    .maybeSingle();

  if (certificate) {
    const courseRel = certificate.courses as { title: string } | Array<{ title: string }> | null;
    const course = Array.isArray(courseRel) ? courseRel[0] : courseRel;

    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', certificate.user_id)
      .maybeSingle();

    return {
      valid: true,
      type: 'certificate',
      code: certificate.certificate_code,
      learnerName: profile?.name ?? 'Learner',
      title: course?.title ?? 'Course Certificate',
      score: certificate.score,
      verifiedAt: certificate.issued_at,
      revoked: certificate.revoked_at != null,
    };
  }

  return null;
}
