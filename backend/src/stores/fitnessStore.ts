import type { WorkoutLog, BodyWeightLog, WeeklyPlan, UserMacroProfile, Meal, DayOfWeek } from '../types/fitness';

// In-memory stores per user
const workoutLogs = new Map<string, WorkoutLog[]>();
const bodyWeightLogs = new Map<string, BodyWeightLog[]>();
const weeklyPlans = new Map<string, WeeklyPlan[]>();
const macroProfiles = new Map<string, UserMacroProfile>();
const mealPlans = new Map<string, Map<DayOfWeek, Meal[]>>();

export const fitnessStore = {
  // Workout Logs
  getWorkoutLogs: (userId: string): WorkoutLog[] => {
    return workoutLogs.get(userId) || [];
  },

  addWorkoutLog: (userId: string, log: WorkoutLog): WorkoutLog => {
    const userLogs = workoutLogs.get(userId) || [];
    userLogs.unshift(log);
    workoutLogs.set(userId, userLogs);
    return log;
  },

  updateWorkoutLog: (userId: string, id: string, updates: Partial<WorkoutLog>): boolean => {
    const userLogs = workoutLogs.get(userId);
    if (!userLogs) return false;
    
    const index = userLogs.findIndex(log => log.id === id);
    if (index === -1) return false;
    
    userLogs[index] = { ...userLogs[index], ...updates };
    return true;
  },

  deleteWorkoutLog: (userId: string, id: string): boolean => {
    const userLogs = workoutLogs.get(userId);
    if (!userLogs) return false;
    
    const index = userLogs.findIndex(log => log.id === id);
    if (index === -1) return false;
    
    userLogs.splice(index, 1);
    return true;
  },

  // Body Weight Logs
  getBodyWeightLogs: (userId: string): BodyWeightLog[] => {
    return bodyWeightLogs.get(userId) || [];
  },

  addBodyWeightLog: (userId: string, log: BodyWeightLog): BodyWeightLog => {
    const userLogs = bodyWeightLogs.get(userId) || [];
    userLogs.unshift(log);
    bodyWeightLogs.set(userId, userLogs);
    return log;
  },

  updateBodyWeightLog: (userId: string, id: string, updates: Partial<BodyWeightLog>): boolean => {
    const userLogs = bodyWeightLogs.get(userId);
    if (!userLogs) return false;
    
    const index = userLogs.findIndex(log => log.id === id);
    if (index === -1) return false;
    
    userLogs[index] = { ...userLogs[index], ...updates };
    return true;
  },

  deleteBodyWeightLog: (userId: string, id: string): boolean => {
    const userLogs = bodyWeightLogs.get(userId);
    if (!userLogs) return false;
    
    const index = userLogs.findIndex(log => log.id === id);
    if (index === -1) return false;
    
    userLogs.splice(index, 1);
    return true;
  },

  // Weekly Plans
  getWeeklyPlans: (userId: string): WeeklyPlan[] => {
    return weeklyPlans.get(userId) || [];
  },

  addWeeklyPlan: (userId: string, plan: WeeklyPlan): WeeklyPlan => {
    const userPlans = weeklyPlans.get(userId) || [];
    userPlans.push(plan);
    weeklyPlans.set(userId, userPlans);
    return plan;
  },

  updateWeeklyPlan: (userId: string, id: string, updates: Partial<WeeklyPlan>): boolean => {
    const userPlans = weeklyPlans.get(userId);
    if (!userPlans) return false;
    
    const index = userPlans.findIndex(plan => plan.id === id);
    if (index === -1) return false;
    
    userPlans[index] = { ...userPlans[index], ...updates };
    return true;
  },

  deleteWeeklyPlan: (userId: string, id: string): boolean => {
    const userPlans = weeklyPlans.get(userId);
    if (!userPlans) return false;
    
    const index = userPlans.findIndex(plan => plan.id === id);
    if (index === -1) return false;
    
    userPlans.splice(index, 1);
    return true;
  },

  setActivePlan: (userId: string, planId: string): boolean => {
    const userPlans = weeklyPlans.get(userId);
    if (!userPlans) return false;
    
    userPlans.forEach(plan => {
      plan.isActive = plan.id === planId;
    });
    return true;
  },

  // Macro Profiles
  getMacroProfile: (userId: string): UserMacroProfile | null => {
    return macroProfiles.get(userId) || null;
  },

  saveMacroProfile: (userId: string, profile: UserMacroProfile): UserMacroProfile => {
    macroProfiles.set(userId, profile);
    return profile;
  },

  // Meal Plans
  getMealPlans: (userId: string): Map<DayOfWeek, Meal[]> => {
    return mealPlans.get(userId) || new Map();
  },

  saveMealPlan: (userId: string, day: DayOfWeek, meals: Meal[]): void => {
    let userMealPlans = mealPlans.get(userId);
    if (!userMealPlans) {
      userMealPlans = new Map();
      mealPlans.set(userId, userMealPlans);
    }
    userMealPlans.set(day, meals);
  },

  // Clear all data for a user (on logout)
  clearUserData: (userId: string): void => {
    workoutLogs.delete(userId);
    bodyWeightLogs.delete(userId);
    weeklyPlans.delete(userId);
    macroProfiles.delete(userId);
    mealPlans.delete(userId);
  }
};
