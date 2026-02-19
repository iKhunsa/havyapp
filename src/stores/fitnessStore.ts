import { create } from 'zustand';
import type { 
  WeeklyPlan, 
  WorkoutLog, 
  NutritionLog, 
  DayOfWeek,
  MuscleGroup,
  AntiEgoAlert,
  BodyWeightLog,
  UserMacroProfile,
  DayMealPlan,
  Meal
} from '@/types/fitness';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const ENABLE_BACKEND_SYNC = import.meta.env.VITE_ENABLE_BACKEND_SYNC === 'true';

const persistFitnessChange = async (path: string, init: RequestInit) => {
  if (!ENABLE_BACKEND_SYNC) return;
  const token = localStorage.getItem('auth_token');
  if (!token) return;

  try {
    await fetch(`${API_URL}/fitness${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    // no-op: local state remains usable in offline/error scenarios
  }
};

interface FitnessState {
  // Plans
  weeklyPlans: WeeklyPlan[];
  activePlanId: string | null;
  
  // Logs
  workoutLogs: WorkoutLog[];
  nutritionLogs: NutritionLog[];
  bodyWeightLogs: BodyWeightLog[];
  
  // Current session
  alerts: AntiEgoAlert[];
  
  // Nutrition
  macroProfile: UserMacroProfile | null;
  mealPlans: DayMealPlan[];
  
  // Actions
  setActivePlan: (planId: string) => void;
  addWorkoutLog: (log: WorkoutLog) => void;
  updateWorkoutLog: (logId: string, updates: Partial<WorkoutLog>) => void;
  deleteWorkoutLog: (logId: string) => void;
  addAlert: (alert: AntiEgoAlert) => void;
  clearAlerts: () => void;
  addWeeklyPlan: (plan: WeeklyPlan) => void;
  updateWeeklyPlan: (planId: string, updates: Partial<WeeklyPlan>) => void;
  addBodyWeightLog: (log: BodyWeightLog) => void;
  updateBodyWeightLog: (logId: string, updates: Partial<BodyWeightLog>) => void;
  deleteBodyWeightLog: (logId: string) => void;
  setMacroProfile: (profile: UserMacroProfile) => void;
  updateMealPlan: (day: DayOfWeek, meals: Meal[]) => void;
  addMeal: (day: DayOfWeek, meal: Meal) => void;
  updateMeal: (day: DayOfWeek, mealId: string, updates: Partial<Meal>) => void;
  deleteMeal: (day: DayOfWeek, mealId: string) => void;
  reorderMeals: (day: DayOfWeek, mealIds: string[]) => void;
}

const initialMealPlans: DayMealPlan[] = [
  { day: 'lunes', meals: [] },
  { day: 'martes', meals: [] },
  { day: 'miercoles', meals: [] },
  { day: 'jueves', meals: [] },
  { day: 'viernes', meals: [] },
  { day: 'sabado', meals: [] },
  { day: 'domingo', meals: [] },
];

export const useFitnessStore = create<FitnessState>()(
  (set, get) => ({
    weeklyPlans: [],
    activePlanId: null,
    workoutLogs: [],
    nutritionLogs: [],
    bodyWeightLogs: [],
    alerts: [],
    macroProfile: null,
    mealPlans: initialMealPlans,
    
    setActivePlan: (planId) => {
      set((state) => ({
        activePlanId: planId,
        weeklyPlans: state.weeklyPlans.map((plan) => ({
          ...plan,
          isActive: plan.id === planId,
        })),
      }));
      void persistFitnessChange(`/plans/${planId}/activate`, { method: 'POST' });
    },
    
    addWorkoutLog: (log) => {
      set((state) => ({
        workoutLogs: [...state.workoutLogs, log]
      }));
      void persistFitnessChange('/workouts', { method: 'POST', body: JSON.stringify(log) });
    },
    
    updateWorkoutLog: (logId, updates) => {
      set((state) => ({
        workoutLogs: state.workoutLogs.map(log => 
          log.id === logId ? { ...log, ...updates } : log
        )
      }));
      void persistFitnessChange(`/workouts/${logId}`, { method: 'PATCH', body: JSON.stringify(updates) });
    },
    
    deleteWorkoutLog: (logId) => {
      set((state) => ({
        workoutLogs: state.workoutLogs.filter(log => log.id !== logId)
      }));
      void persistFitnessChange(`/workouts/${logId}`, { method: 'DELETE' });
    },
    
    addAlert: (alert) => set((state) => ({
      alerts: [...state.alerts, alert]
    })),
    
    clearAlerts: () => set({ alerts: [] }),
    
    addWeeklyPlan: (plan) => {
      set((state) => ({
        weeklyPlans: [...state.weeklyPlans, plan]
      }));
      void persistFitnessChange('/plans', { method: 'POST', body: JSON.stringify(plan) });
    },
    
    updateWeeklyPlan: (planId, updates) => {
      set((state) => ({
        weeklyPlans: state.weeklyPlans.map(p => 
          p.id === planId ? { ...p, ...updates } : p
        )
      }));
      void persistFitnessChange(`/plans/${planId}`, { method: 'PATCH', body: JSON.stringify(updates) });
    },
    
    addBodyWeightLog: (log) => {
      set((state) => ({
        bodyWeightLogs: [...state.bodyWeightLogs, log]
      }));
      void persistFitnessChange('/weights', { method: 'POST', body: JSON.stringify(log) });
    },
    
    updateBodyWeightLog: (logId, updates) => {
      set((state) => ({
        bodyWeightLogs: state.bodyWeightLogs.map(log =>
          log.id === logId ? { ...log, ...updates } : log
        )
      }));
      void persistFitnessChange(`/weights/${logId}`, { method: 'PATCH', body: JSON.stringify(updates) });
    },
    
    deleteBodyWeightLog: (logId) => {
      set((state) => ({
        bodyWeightLogs: state.bodyWeightLogs.filter(log => log.id !== logId)
      }));
      void persistFitnessChange(`/weights/${logId}`, { method: 'DELETE' });
    },
    
    setMacroProfile: (profile) => {
      set({ macroProfile: profile });
      void persistFitnessChange('/profile', { method: 'POST', body: JSON.stringify(profile) });
    },
    
    updateMealPlan: (day, meals) => {
      set((state) => ({
        mealPlans: state.mealPlans.map(p =>
          p.day === day ? { ...p, meals } : p
        )
      }));
      void persistFitnessChange('/meals', { method: 'POST', body: JSON.stringify({ day, meals }) });
    },
    
    addMeal: (day, meal) => {
      set((state) => ({
        mealPlans: state.mealPlans.map(p =>
          p.day === day ? { ...p, meals: [...p.meals, meal] } : p
        )
      }));
      const meals = get().mealPlans.find((plan) => plan.day === day)?.meals ?? [];
      void persistFitnessChange('/meals', { method: 'POST', body: JSON.stringify({ day, meals }) });
    },
    
    updateMeal: (day, mealId, updates) => {
      set((state) => ({
        mealPlans: state.mealPlans.map(p =>
          p.day === day 
            ? { ...p, meals: p.meals.map(m => m.id === mealId ? { ...m, ...updates } : m) }
            : p
        )
      }));
      const meals = get().mealPlans.find((plan) => plan.day === day)?.meals ?? [];
      void persistFitnessChange('/meals', { method: 'POST', body: JSON.stringify({ day, meals }) });
    },
    
    deleteMeal: (day, mealId) => {
      set((state) => ({
        mealPlans: state.mealPlans.map(p =>
          p.day === day ? { ...p, meals: p.meals.filter(m => m.id !== mealId) } : p
        )
      }));
      const meals = get().mealPlans.find((plan) => plan.day === day)?.meals ?? [];
      void persistFitnessChange('/meals', { method: 'POST', body: JSON.stringify({ day, meals }) });
    },
    
    reorderMeals: (day, mealIds) => {
      set((state) => ({
        mealPlans: state.mealPlans.map(p => {
          if (p.day !== day) return p;
          const orderedMeals = mealIds
            .map((id, index) => {
              const meal = p.meals.find(m => m.id === id);
              return meal ? { ...meal, order: index } : null;
            })
            .filter(Boolean) as typeof p.meals;
          return { ...p, meals: orderedMeals };
        })
      }));
      const meals = get().mealPlans.find((plan) => plan.day === day)?.meals ?? [];
      void persistFitnessChange('/meals', { method: 'POST', body: JSON.stringify({ day, meals }) });
    },
  })
);

// Selectors
export const useActivePlan = () => {
  const { weeklyPlans, activePlanId } = useFitnessStore();
  return weeklyPlans.find((p) => p.id === activePlanId) ?? weeklyPlans[0];
};

export const useTodayExercises = () => {
  const plan = useActivePlan();
  if (!plan) return [];
  
  const days: DayOfWeek[] = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const today = days[new Date().getDay()];
  
  const todayItem = plan.items.find(item => item.day === today);
  return todayItem?.exercises || [];
};
