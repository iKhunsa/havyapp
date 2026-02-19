import { createContext } from 'react';
import type { WorkoutLog, BodyWeightLog, WeeklyPlan, UserMacroProfile, DayOfWeek, Meal } from '@/types/fitness';

export interface DataContextType {
  loading: boolean;
  error: string | null;
  workoutLogs: WorkoutLog[];
  bodyWeightLogs: BodyWeightLog[];
  weeklyPlans: WeeklyPlan[];
  macroProfile: UserMacroProfile | null;
  mealPlans: Record<DayOfWeek, Meal[]>;
  addWorkoutLog: (log: Omit<WorkoutLog, 'id'>) => Promise<WorkoutLog | null>;
  updateWorkoutLog: (id: string, updates: Partial<WorkoutLog>) => Promise<void>;
  deleteWorkoutLog: (id: string) => Promise<void>;
  addBodyWeightLog: (log: Omit<BodyWeightLog, 'id'>) => Promise<BodyWeightLog | null>;
  updateBodyWeightLog: (id: string, updates: Partial<BodyWeightLog>) => Promise<void>;
  deleteBodyWeightLog: (id: string) => Promise<void>;
  saveMacroProfile: (profile: UserMacroProfile) => Promise<void>;
  saveMealPlan: (day: DayOfWeek, meals: Meal[]) => Promise<void>;
  saveWeeklyPlan: (plan: Omit<WeeklyPlan, 'id' | 'createdAt'> & { id?: string }) => Promise<WeeklyPlan | null>;
  setActivePlan: (planId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const DataContext = createContext<DataContextType | null>(null);
