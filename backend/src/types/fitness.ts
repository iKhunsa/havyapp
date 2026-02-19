export type DayOfWeek = 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado' | 'domingo';

export type MuscleGroup = 
  | 'pecho' 
  | 'espalda' 
  | 'hombros' 
  | 'biceps' 
  | 'triceps' 
  | 'piernas' 
  | 'gluteos' 
  | 'core' 
  | 'cardio'
  | 'descanso';

export type SemaphoreStatus = 'green' | 'yellow' | 'red';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  videoUrl?: string;
  restSeconds: number;
  order: number;
}

export interface PlanItem {
  id: string;
  day: DayOfWeek;
  muscleGroups: MuscleGroup[];
  exercises: Exercise[];
}

export interface WeeklyPlan {
  id: string;
  name: string;
  createdAt: Date;
  isActive: boolean;
  items: PlanItem[];
}

export interface WorkoutSet {
  weight: number;
  reps: number;
  tempo: string;
  toFailure: boolean;
}

export interface WorkoutLog {
  id: string;
  date: Date;
  exerciseId: string;
  exerciseName: string;
  muscleGroups: MuscleGroup[];
  sets: WorkoutSet[];
  suggestedRest: number;
  notes?: string;
}

export interface BodyWeightLog {
  id: string;
  date: Date;
  weight: number;
}

export interface UserMacroProfile {
  weight: number;
  height: number;
  age: number;
  sex: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose' | 'maintain' | 'gain';
}

export interface MacroTarget {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Meal {
  id: string;
  name: string;
  type: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  order: number;
}

export interface DayMealPlan {
  day: DayOfWeek;
  meals: Meal[];
}

export interface RecoveryLog {
  id: string;
  date: Date;
  sleepHours: number;
  nervousState: 1 | 2 | 3 | 4 | 5;
  perceivedRecovery?: 1 | 2 | 3 | 4 | 5;
  calculatedFatigue: number;
  lastStimulusByMuscle: Record<MuscleGroup, number>;
  semaphoreStatus: SemaphoreStatus;
}

export interface NutritionLog {
  id: string;
  date: Date;
  minProteinMet: boolean;
  calorieTarget: number;
  strategicCarbs: boolean;
}

export interface AnalyticsRange {
  type: 'day' | 'week' | 'month' | 'year' | 'custom';
  startDate?: Date;
  endDate?: Date;
}

export interface AntiEgoAlert {
  type: 'stagnation' | 'ego' | 'overtraining' | 'blocked';
  message: string;
  severity: 'warning' | 'critical';
  exerciseId?: string;
}
