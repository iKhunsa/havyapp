import type { User } from '../types';
import type { BodyWeightLog, DayOfWeek, Meal, UserMacroProfile, WeeklyPlan, WorkoutLog } from '../types/fitness';

const usersById = new Map<string, User>();
const usersByEmail = new Map<string, User>();

const workouts = new Map<string, WorkoutLog[]>();
const weights = new Map<string, BodyWeightLog[]>();
const plans = new Map<string, WeeklyPlan[]>();
const macros = new Map<string, UserMacroProfile>();
const meals = new Map<string, Map<DayOfWeek, Meal[]>>();

const ensureList = <T>(map: Map<string, T[]>, userId: string) => {
  const existing = map.get(userId);
  if (existing) return existing;
  const created: T[] = [];
  map.set(userId, created);
  return created;
};

export const resetMockRepository = () => {
  usersById.clear();
  usersByEmail.clear();
  workouts.clear();
  weights.clear();
  plans.clear();
  macros.clear();
  meals.clear();
};

export const userRepositoryMock = {
  async findByEmail(email: string): Promise<User | null> {
    return usersByEmail.get(email) ?? null;
  },
  async findById(id: string): Promise<User | null> {
    return usersById.get(id) ?? null;
  },
  async create(user: User): Promise<User> {
    usersById.set(user.id, user);
    usersByEmail.set(user.email, user);
    return user;
  },
};

export const fitnessRepositoryMock = {
  async getWorkoutLogs(userId: string) {
    return [...(workouts.get(userId) ?? [])];
  },
  async saveWorkoutLog(userId: string, log: WorkoutLog) {
    const list = ensureList(workouts, userId);
    const index = list.findIndex((item) => item.id === log.id);
    if (index >= 0) {
      list[index] = log;
    } else {
      list.unshift(log);
    }
    return log;
  },
  async updateWorkoutLog(userId: string, id: string, updates: Partial<WorkoutLog>) {
    const list = workouts.get(userId) ?? [];
    const index = list.findIndex((item) => item.id === id);
    if (index < 0) return false;
    list[index] = { ...list[index], ...updates };
    return true;
  },
  async deleteWorkoutLog(userId: string, id: string) {
    const list = workouts.get(userId) ?? [];
    const index = list.findIndex((item) => item.id === id);
    if (index < 0) return false;
    list.splice(index, 1);
    return true;
  },

  async getBodyWeightLogs(userId: string) {
    return [...(weights.get(userId) ?? [])];
  },
  async saveBodyWeightLog(userId: string, log: BodyWeightLog) {
    const list = ensureList(weights, userId);
    const index = list.findIndex((item) => item.id === log.id);
    if (index >= 0) {
      list[index] = log;
    } else {
      list.unshift(log);
    }
    return log;
  },
  async updateBodyWeightLog(userId: string, id: string, updates: Partial<BodyWeightLog>) {
    const list = weights.get(userId) ?? [];
    const index = list.findIndex((item) => item.id === id);
    if (index < 0) return false;
    list[index] = { ...list[index], ...updates };
    return true;
  },
  async deleteBodyWeightLog(userId: string, id: string) {
    const list = weights.get(userId) ?? [];
    const index = list.findIndex((item) => item.id === id);
    if (index < 0) return false;
    list.splice(index, 1);
    return true;
  },

  async getWeeklyPlans(userId: string) {
    return [...(plans.get(userId) ?? [])];
  },
  async saveWeeklyPlan(userId: string, plan: WeeklyPlan) {
    const list = ensureList(plans, userId);
    const index = list.findIndex((item) => item.id === plan.id);
    if (index >= 0) {
      list[index] = plan;
    } else {
      list.push(plan);
    }
    return plan;
  },
  async updateWeeklyPlan(userId: string, id: string, updates: Partial<WeeklyPlan>) {
    const list = plans.get(userId) ?? [];
    const index = list.findIndex((item) => item.id === id);
    if (index < 0) return false;
    list[index] = { ...list[index], ...updates };
    return true;
  },
  async deleteWeeklyPlan(userId: string, id: string) {
    const list = plans.get(userId) ?? [];
    const index = list.findIndex((item) => item.id === id);
    if (index < 0) return false;
    list.splice(index, 1);
    return true;
  },
  async setActivePlan(userId: string, planId: string) {
    const list = plans.get(userId) ?? [];
    const exists = list.some((item) => item.id === planId);
    if (!exists) return false;
    list.forEach((item) => {
      item.isActive = item.id === planId;
    });
    return true;
  },

  async getMacroProfile(userId: string) {
    return macros.get(userId) ?? null;
  },
  async saveMacroProfile(userId: string, profile: UserMacroProfile) {
    macros.set(userId, profile);
    return profile;
  },

  async getMealPlans(userId: string) {
    return meals.get(userId) ?? new Map<DayOfWeek, Meal[]>();
  },
  async saveMealPlan(userId: string, day: DayOfWeek, dayMeals: Meal[]) {
    let perUser = meals.get(userId);
    if (!perUser) {
      perUser = new Map<DayOfWeek, Meal[]>();
      meals.set(userId, perUser);
    }
    perUser.set(day, dayMeals);
  },

  async importAll(
    userId: string,
    payload: {
      workoutLogs?: WorkoutLog[];
      bodyWeightLogs?: BodyWeightLog[];
      weeklyPlans?: WeeklyPlan[];
      macroProfile?: UserMacroProfile | null;
      mealPlans?: Partial<Record<DayOfWeek, Meal[]>>;
    },
  ) {
    (payload.workoutLogs ?? []).forEach((log) => {
      void fitnessRepositoryMock.saveWorkoutLog(userId, log);
    });
    (payload.bodyWeightLogs ?? []).forEach((log) => {
      void fitnessRepositoryMock.saveBodyWeightLog(userId, log);
    });
    (payload.weeklyPlans ?? []).forEach((plan) => {
      void fitnessRepositoryMock.saveWeeklyPlan(userId, plan);
    });
    if (payload.macroProfile) {
      macros.set(userId, payload.macroProfile);
    }
    Object.entries(payload.mealPlans ?? {}).forEach(([day, list]) => {
      void fitnessRepositoryMock.saveMealPlan(userId, day as DayOfWeek, list ?? []);
    });
  },
};
