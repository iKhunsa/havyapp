import type { User } from '../types';
import type { BodyWeightLog, DayOfWeek, Meal, UserMacroProfile, WeeklyPlan, WorkoutLog } from '../types/fitness';
import { db } from './client';

const toUser = (row: { id: string; email: string; password_hash: string; created_at: Date }): User => ({
  id: row.id,
  email: row.email,
  passwordHash: row.password_hash,
  createdAt: new Date(row.created_at),
});

const toWorkoutLog = (row: any): WorkoutLog => ({
  id: row.id,
  date: new Date(row.date),
  exerciseId: row.exercise_id,
  exerciseName: row.exercise_name,
  muscleGroups: row.muscle_groups,
  sets: row.sets,
  suggestedRest: row.suggested_rest,
  notes: row.notes ?? undefined,
});

const toBodyWeightLog = (row: any): BodyWeightLog => ({
  id: row.id,
  date: new Date(row.date),
  weight: row.weight,
});

const toWeeklyPlan = (row: any): WeeklyPlan => ({
  id: row.id,
  name: row.name,
  createdAt: new Date(row.created_at),
  isActive: row.is_active,
  items: row.items,
});

export const userRepository = {
  findByEmail: async (email: string): Promise<User | null> => {
    const result = await db.query(
      `SELECT id, email, password_hash, created_at FROM users WHERE email = $1 LIMIT 1`,
      [email],
    );
    if (result.rowCount === 0) return null;
    return toUser(result.rows[0]);
  },

  findById: async (id: string): Promise<User | null> => {
    const result = await db.query(
      `SELECT id, email, password_hash, created_at FROM users WHERE id = $1 LIMIT 1`,
      [id],
    );
    if (result.rowCount === 0) return null;
    return toUser(result.rows[0]);
  },

  create: async (user: User): Promise<User> => {
    const result = await db.query(
      `INSERT INTO users (id, email, password_hash, created_at)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, password_hash, created_at`,
      [user.id, user.email, user.passwordHash, user.createdAt],
    );
    return toUser(result.rows[0]);
  },
};

export const fitnessRepository = {
  getWorkoutLogs: async (userId: string): Promise<WorkoutLog[]> => {
    const result = await db.query(
      `SELECT id, date, exercise_id, exercise_name, muscle_groups, sets, suggested_rest, notes
       FROM workout_logs WHERE user_id = $1 ORDER BY date DESC`,
      [userId],
    );
    return result.rows.map(toWorkoutLog);
  },

  saveWorkoutLog: async (userId: string, log: WorkoutLog): Promise<WorkoutLog> => {
    const result = await db.query(
      `INSERT INTO workout_logs (id, user_id, date, exercise_id, exercise_name, muscle_groups, sets, suggested_rest, notes)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8,$9)
       ON CONFLICT (user_id, id)
       DO UPDATE SET date = EXCLUDED.date,
                     exercise_id = EXCLUDED.exercise_id,
                     exercise_name = EXCLUDED.exercise_name,
                     muscle_groups = EXCLUDED.muscle_groups,
                     sets = EXCLUDED.sets,
                     suggested_rest = EXCLUDED.suggested_rest,
                     notes = EXCLUDED.notes
       RETURNING id, date, exercise_id, exercise_name, muscle_groups, sets, suggested_rest, notes`,
      [
        log.id,
        userId,
        log.date,
        log.exerciseId,
        log.exerciseName,
        JSON.stringify(log.muscleGroups ?? []),
        JSON.stringify(log.sets ?? []),
        log.suggestedRest,
        log.notes ?? null,
      ],
    );
    return toWorkoutLog(result.rows[0]);
  },

  updateWorkoutLog: async (userId: string, id: string, updates: Partial<WorkoutLog>): Promise<boolean> => {
    const existing = await db.query(`SELECT * FROM workout_logs WHERE user_id = $1 AND id = $2`, [userId, id]);
    if (existing.rowCount === 0) return false;
    const current = toWorkoutLog(existing.rows[0]);
    const merged: WorkoutLog = { ...current, ...updates };
    await fitnessRepository.saveWorkoutLog(userId, merged);
    return true;
  },

  deleteWorkoutLog: async (userId: string, id: string): Promise<boolean> => {
    const result = await db.query(`DELETE FROM workout_logs WHERE user_id = $1 AND id = $2`, [userId, id]);
    return (result.rowCount ?? 0) > 0;
  },

  getBodyWeightLogs: async (userId: string): Promise<BodyWeightLog[]> => {
    const result = await db.query(
      `SELECT id, date, weight FROM body_weight_logs WHERE user_id = $1 ORDER BY date DESC`,
      [userId],
    );
    return result.rows.map(toBodyWeightLog);
  },

  saveBodyWeightLog: async (userId: string, log: BodyWeightLog): Promise<BodyWeightLog> => {
    const result = await db.query(
      `INSERT INTO body_weight_logs (id, user_id, date, weight)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, id)
       DO UPDATE SET date = EXCLUDED.date, weight = EXCLUDED.weight
       RETURNING id, date, weight`,
      [log.id, userId, log.date, log.weight],
    );
    return toBodyWeightLog(result.rows[0]);
  },

  updateBodyWeightLog: async (userId: string, id: string, updates: Partial<BodyWeightLog>): Promise<boolean> => {
    const existing = await db.query(`SELECT id, date, weight FROM body_weight_logs WHERE user_id = $1 AND id = $2`, [userId, id]);
    if (existing.rowCount === 0) return false;
    const current = toBodyWeightLog(existing.rows[0]);
    const merged: BodyWeightLog = { ...current, ...updates };
    await fitnessRepository.saveBodyWeightLog(userId, merged);
    return true;
  },

  deleteBodyWeightLog: async (userId: string, id: string): Promise<boolean> => {
    const result = await db.query(`DELETE FROM body_weight_logs WHERE user_id = $1 AND id = $2`, [userId, id]);
    return (result.rowCount ?? 0) > 0;
  },

  getWeeklyPlans: async (userId: string): Promise<WeeklyPlan[]> => {
    const result = await db.query(
      `SELECT id, name, created_at, is_active, items FROM weekly_plans WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId],
    );
    return result.rows.map(toWeeklyPlan);
  },

  saveWeeklyPlan: async (userId: string, plan: WeeklyPlan): Promise<WeeklyPlan> => {
    const result = await db.query(
      `INSERT INTO weekly_plans (id, user_id, name, created_at, is_active, items)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb)
       ON CONFLICT (user_id, id)
       DO UPDATE SET name = EXCLUDED.name,
                     created_at = EXCLUDED.created_at,
                     is_active = EXCLUDED.is_active,
                     items = EXCLUDED.items
       RETURNING id, name, created_at, is_active, items`,
      [plan.id, userId, plan.name, plan.createdAt, plan.isActive, JSON.stringify(plan.items ?? [])],
    );
    return toWeeklyPlan(result.rows[0]);
  },

  updateWeeklyPlan: async (userId: string, id: string, updates: Partial<WeeklyPlan>): Promise<boolean> => {
    const existing = await db.query(
      `SELECT id, name, created_at, is_active, items FROM weekly_plans WHERE user_id = $1 AND id = $2`,
      [userId, id],
    );
    if (existing.rowCount === 0) return false;
    const current = toWeeklyPlan(existing.rows[0]);
    const merged: WeeklyPlan = { ...current, ...updates };
    await fitnessRepository.saveWeeklyPlan(userId, merged);
    return true;
  },

  deleteWeeklyPlan: async (userId: string, id: string): Promise<boolean> => {
    const result = await db.query(`DELETE FROM weekly_plans WHERE user_id = $1 AND id = $2`, [userId, id]);
    return (result.rowCount ?? 0) > 0;
  },

  setActivePlan: async (userId: string, planId: string): Promise<boolean> => {
    const exists = await db.query(`SELECT id FROM weekly_plans WHERE user_id = $1 AND id = $2`, [userId, planId]);
    if (exists.rowCount === 0) return false;
    await db.query(`UPDATE weekly_plans SET is_active = false WHERE user_id = $1`, [userId]);
    await db.query(`UPDATE weekly_plans SET is_active = true WHERE user_id = $1 AND id = $2`, [userId, planId]);
    return true;
  },

  getMacroProfile: async (userId: string): Promise<UserMacroProfile | null> => {
    const result = await db.query(
      `SELECT weight, height, age, sex, activity_level, goal FROM macro_profiles WHERE user_id = $1`,
      [userId],
    );
    if (result.rowCount === 0) return null;
    const row = result.rows[0];
    return {
      weight: row.weight,
      height: row.height,
      age: row.age,
      sex: row.sex,
      activityLevel: row.activity_level,
      goal: row.goal,
    };
  },

  saveMacroProfile: async (userId: string, profile: UserMacroProfile): Promise<UserMacroProfile> => {
    await db.query(
      `INSERT INTO macro_profiles (user_id, weight, height, age, sex, activity_level, goal, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET weight = EXCLUDED.weight,
                     height = EXCLUDED.height,
                     age = EXCLUDED.age,
                     sex = EXCLUDED.sex,
                     activity_level = EXCLUDED.activity_level,
                     goal = EXCLUDED.goal,
                     updated_at = NOW()`,
      [userId, profile.weight, profile.height, profile.age, profile.sex, profile.activityLevel, profile.goal],
    );
    return profile;
  },

  getMealPlans: async (userId: string): Promise<Map<DayOfWeek, Meal[]>> => {
    const result = await db.query(`SELECT day, meals FROM meal_plans WHERE user_id = $1`, [userId]);
    const plans = new Map<DayOfWeek, Meal[]>();
    for (const row of result.rows) {
      plans.set(row.day, row.meals ?? []);
    }
    return plans;
  },

  saveMealPlan: async (userId: string, day: DayOfWeek, meals: Meal[]): Promise<void> => {
    await db.query(
      `INSERT INTO meal_plans (user_id, day, meals)
       VALUES ($1, $2, $3::jsonb)
       ON CONFLICT (user_id, day)
       DO UPDATE SET meals = EXCLUDED.meals`,
      [userId, day, JSON.stringify(meals ?? [])],
    );
  },

  importAll: async (
    userId: string,
    payload: {
      workoutLogs?: WorkoutLog[];
      bodyWeightLogs?: BodyWeightLog[];
      weeklyPlans?: WeeklyPlan[];
      macroProfile?: UserMacroProfile | null;
      mealPlans?: Partial<Record<DayOfWeek, Meal[]>>;
    },
  ): Promise<void> => {
    const logs = payload.workoutLogs ?? [];
    for (const log of logs) {
      await fitnessRepository.saveWorkoutLog(userId, { ...log, date: new Date(log.date) });
    }

    const weights = payload.bodyWeightLogs ?? [];
    for (const log of weights) {
      await fitnessRepository.saveBodyWeightLog(userId, { ...log, date: new Date(log.date) });
    }

    const plans = payload.weeklyPlans ?? [];
    for (const plan of plans) {
      await fitnessRepository.saveWeeklyPlan(userId, { ...plan, createdAt: new Date(plan.createdAt) });
    }

    if (payload.macroProfile) {
      await fitnessRepository.saveMacroProfile(userId, payload.macroProfile);
    }

    if (payload.mealPlans) {
      for (const [day, meals] of Object.entries(payload.mealPlans)) {
        await fitnessRepository.saveMealPlan(userId, day as DayOfWeek, meals ?? []);
      }
    }
  },
};
