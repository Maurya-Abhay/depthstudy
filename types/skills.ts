export type SkillCategory = 'general' | 'programming' | 'algorithms' | 'web' | 'data' | 'system-design' | string;

export interface Skill {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: SkillCategory;
  published: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface SkillTopic {
  id: string;
  skillId: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string;
  published: boolean;
  sortOrder: number;
}

export interface UserSkillMastery {
  userId: string;
  skillId: string;
  masteryScore: number;
  confidenceScore: number;
  attempts: number;
  successfulAttempts: number;
  lastActivityAt: string | null;
  updatedAt: string;
}

export type SkillEventType =
  | 'topic_progress'
  | 'topic_completed'
  | 'test_passed'
  | 'test_attempt'
  | 'dsa_accepted'
  | 'dsa_submission'
  | 'activity'
  | 'study_session';

export type SkillEventSource = 'system' | 'progress' | 'test' | 'dsa' | 'activity' | 'assessment';

export interface SkillEvent {
  id: string;
  userId: string;
  skillId: string | null;
  topicId: string | null;
  eventType: SkillEventType;
  score: number | null;
  source: SkillEventSource;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export type GapPriority = 'low' | 'medium' | 'high' | 'critical';

export interface SkillGapSnapshot {
  id: string;
  userId: string;
  skillId: string;
  gapScore: number;
  priority: GapPriority;
  reason: string;
  generatedAt: string;
}

export interface SkillProfileItem {
  skill: Skill;
  mastery: UserSkillMastery | null;
  strongest: boolean;
  weakest: boolean;
}

export interface SkillProfile {
  userId: string;
  skills: SkillProfileItem[];
  strongestSkills: SkillProfileItem[];
  weakestSkills: SkillProfileItem[];
  totalAttempts: number;
  averageMastery: number;
  generatedAt: string;
}

export interface SkillGap {
  skill: Skill;
  masteryScore: number;
  confidenceScore: number;
  gapScore: number;
  priority: GapPriority;
  reason: string;
}

export interface SkillGapsResult {
  userId: string;
  gaps: SkillGap[];
  highPriorityGaps: SkillGap[];
  generatedAt: string;
}
