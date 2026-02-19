// Types for the fitness app

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

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  videoUrl?: string;
  restSeconds: number; // Suggested rest, not editable by user
  order: number;
}

export interface PlanItem {
  id: string;
  day: DayOfWeek;
  muscleGroups: MuscleGroup[]; // Changed to array for multiple muscle groups
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
  tempo: string; // e.g., "3-1-2" (eccentric-pause-concentric)
  toFailure: boolean;
}

export interface WorkoutLog {
  id: string;
  date: Date;
  exerciseId: string;
  exerciseName: string;
  muscleGroups: MuscleGroup[]; // Changed to array
  sets: WorkoutSet[];
  suggestedRest: number;
  notes?: string;
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

export interface BodyWeightLog {
  id: string;
  date: Date;
  weight: number; // kg
}

// Nutrition types
export interface UserMacroProfile {
  weight: number; // kg
  height: number; // cm
  age: number;
  sex: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose' | 'maintain' | 'gain';
}

export interface MacroTarget {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
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
