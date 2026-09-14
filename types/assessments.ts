export type MistakeCategoryCode =
  | 'concept_gap' | 'logic_error' | 'edge_case' | 'syntax_error'
  | 'runtime_error' | 'time_complexity' | 'wrong_output'
  | 'knowledge_gap' | 'careless_error' | 'unknown';

export type MistakeSource = 'test' | 'assessment' | 'dsa' | 'study' | 'activity';

export interface MistakeCategory {
  code: MistakeCategoryCode;
  label: string;
  description: string;
}

export interface MistakeLog {
  id: string;
  userId: string;
  source: MistakeSource;
  sourceId: string | null;
  skillId: string | null;
  category: MistakeCategoryCode;
  severity: number;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface MistakeAggregation {
  category: MistakeCategoryCode;
  label: string;
  count: number;
  lastOccurrence: string | null;
  avgSeverity: number;
}

export interface MistakeIntelligence {
  userId: string;
  totalMistakes: number;
  aggregations: MistakeAggregation[];
  topCategories: MistakeAggregation[];
  generatedAt: string;
}

export type MissionStatus = 'planned' | 'active' | 'completed' | 'skipped';
export type MissionGeneratedBy = 'rule' | 'ai';
export type MissionItemType = 'lesson' | 'practice' | 'review' | 'assessment' | 'dsa';
export type MissionItemStatus = 'pending' | 'active' | 'completed' | 'skipped';

export interface LearningMission {
  id: string;
  userId: string;
  missionDate: string;
  title: string;
  description: string;
  status: MissionStatus;
  generatedBy: MissionGeneratedBy;
  createdAt: string;
  updatedAt: string;
  items: LearningMissionItem[];
}

export interface LearningMissionItem {
  id: string;
  missionId: string;
  position: number;
  itemType: MissionItemType;
  skillId: string | null;
  topicId: string | null;
  dsaProblemId: string | null;
  assessmentId: string | null;
  targetMinutes: number;
  status: MissionItemStatus;
  completedAt: string | null;
}

export interface AssessmentBlueprint {
  id: string;
  skillId: string | null;
  title: string;
  description: string;
  difficulty: string;
  questionCount: number;
  passingScore: number;
  published: boolean;
  createdAt: string;
}

export type AdaptiveAssessmentStatus = 'active' | 'submitted' | 'expired';

export interface AdaptiveAssessment {
  id: string;
  userId: string;
  blueprintId: string | null;
  status: AdaptiveAssessmentStatus;
  currentDifficulty: number;
  score: number | null;
  startedAt: string;
  submittedAt: string | null;
}

export interface AdaptiveAssessmentItem {
  id: string;
  assessmentId: string;
  questionId: string;
  position: number;
  difficulty: number;
  answered: boolean;
  isCorrect: boolean | null;
}

export interface ClientSafeQuestion {
  id: string;
  categoryId: string | null;
  topicId: string | null;
  prompt: string;
  type: string;
  options: unknown[];
  explanation: string;
  published: boolean;
}

export interface AdaptiveAssessmentWithItems {
  assessment: AdaptiveAssessment;
  items: AdaptiveAssessmentItem[];
  totalQuestions: number;
  answeredCount: number;
}
