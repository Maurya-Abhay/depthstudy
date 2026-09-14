export const ONBOARDING_INTERESTS = [
  'DSA',
  'Web Development',
  'JavaScript',
  'React',
  'SQL',
  'Interview Preparation',
] as const;

export type OnboardingInterest = (typeof ONBOARDING_INTERESTS)[number];

export const ONBOARDING_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export type OnboardingLevel = (typeof ONBOARDING_LEVELS)[number];

export const ONBOARDING_GOALS = [
  'placement',
  'interview',
  'college',
  'skill_building',
  'projects',
] as const;
export type OnboardingGoal = (typeof ONBOARDING_GOALS)[number];

export const ONBOARDING_DAILY_MINUTES = [15, 30, 45, 60, 90] as const;
export type OnboardingDailyMinutes = (typeof ONBOARDING_DAILY_MINUTES)[number];

export const ONBOARDING_LEARNING_STYLES = [
  'concept_first',
  'practice_first',
  'balanced',
] as const;
export type OnboardingLearningStyle = (typeof ONBOARDING_LEARNING_STYLES)[number];

export interface UserOnboarding {
  userId: string;
  interests: OnboardingInterest[];
  currentLevel: OnboardingLevel;
  goals: OnboardingGoal[];
  dailyMinutes: OnboardingDailyMinutes;
  learningStyle: OnboardingLearningStyle;
  diagnosticCompleted: boolean;
  diagnosticAssessmentId: string | null;
  onboardingCompleted: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OnboardingInput {
  interests: OnboardingInterest[];
  currentLevel: OnboardingLevel;
  goals: OnboardingGoal[];
  dailyMinutes: OnboardingDailyMinutes;
  learningStyle: OnboardingLearningStyle;
}

export interface OnboardingStatus {
  userId: string;
  isCompleted: boolean;
  hasDiagnostic: boolean;
  needsOnboarding: boolean;
}
