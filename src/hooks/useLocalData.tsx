import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './useAuth';
import type { WorkoutLog, BodyWeightLog, WeeklyPlan, UserMacroProfile, DayOfWeek, Meal } from '@/types/fitness';
import { AppError, isAppError } from '@/lib/app-error';
import { getApiUrl } from '@/lib/api-url';

type LocalFitnessPayload = {
  workoutLogs: WorkoutLog[];
  bodyWeightLogs: BodyWeightLog[];
  weeklyPlans: WeeklyPlan[];
  macroProfile: UserMacroProfile | null;
  mealPlans: Record<DayOfWeek, Meal[]>;
};

const API_URL = getApiUrl();
const LOCAL_DATA_PREFIX = 'fitness_local_data_v1_';
const MIGRATION_FLAG_PREFIX = 'fitness_server_migrated_v1_';

const EMPTY_MEAL_PLANS: Record<DayOfWeek, Meal[]> = {
  lunes: [],
  martes: [],
  miercoles: [],
  jueves: [],
  viernes: [],
  sabado: [],
  domingo: [],
};

const createId = (prefix: string) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const toDate = <T extends { date: Date | string }>(item: T): T => ({
  ...item,
  date: new Date(item.date),
});

const migrationFlagKey = (userId: string) => `${MIGRATION_FLAG_PREFIX}${userId}`;

const parseLegacyPayload = (raw: string): LocalFitnessPayload | null => {
  try {
    const parsed = JSON.parse(raw) as Partial<LocalFitnessPayload>;
    return {
      workoutLogs: (parsed.workoutLogs ?? []).map((log) => toDate(log)),
      bodyWeightLogs: (parsed.bodyWeightLogs ?? []).map((log) => toDate(log)),
      weeklyPlans: (parsed.weeklyPlans ?? []).map((plan) => ({ ...plan, createdAt: new Date(plan.createdAt) })),
      macroProfile: parsed.macroProfile ?? null,
      mealPlans: {
        ...EMPTY_MEAL_PLANS,
        ...(parsed.mealPlans ?? {}),
      },
    };
  } catch {
    return null;
  }
};

const mergeLegacyPayloads = (payloads: LocalFitnessPayload[]): LocalFitnessPayload => {
  const workoutsById = new Map<string, WorkoutLog>();
  const weightsById = new Map<string, BodyWeightLog>();
  const plansById = new Map<string, WeeklyPlan>();
  const meals: Record<DayOfWeek, Meal[]> = { ...EMPTY_MEAL_PLANS };
  let macroProfile: UserMacroProfile | null = null;

  for (const payload of payloads) {
    payload.workoutLogs.forEach((log) => workoutsById.set(log.id, log));
    payload.bodyWeightLogs.forEach((log) => weightsById.set(log.id, log));
    payload.weeklyPlans.forEach((plan) => plansById.set(plan.id, plan));
    if (payload.macroProfile) macroProfile = payload.macroProfile;

    (Object.keys(EMPTY_MEAL_PLANS) as DayOfWeek[]).forEach((day) => {
      if (payload.mealPlans[day]?.length) {
        meals[day] = payload.mealPlans[day];
      }
    });
  }

  return {
    workoutLogs: Array.from(workoutsById.values()),
    bodyWeightLogs: Array.from(weightsById.values()),
    weeklyPlans: Array.from(plansById.values()),
    macroProfile,
    mealPlans: meals,
  };
};

export function useLocalData() {
  const { user, token } = useAuth();
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [bodyWeightLogs, setBodyWeightLogs] = useState<BodyWeightLog[]>([]);
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlan[]>([]);
  const [macroProfile, setMacroProfile] = useState<UserMacroProfile | null>(null);
  const [mealPlans, setMealPlans] = useState<Record<DayOfWeek, Meal[]>>({ ...EMPTY_MEAL_PLANS });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authHeaders = useMemo(() => {
    if (!token) return null;
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }, [token]);

  const ensureAuthenticated = useCallback(() => {
    if (!user || !authHeaders) {
      throw new AppError({
        code: 'NOT_AUTHENTICATED',
        message: 'Not authenticated',
        userMessage: 'Necesitas iniciar sesion para realizar esta accion.',
        action: 'Inicia sesion y vuelve a intentarlo.',
      });
    }
  }, [authHeaders, user]);

  const request = useCallback(async (path: string, init: RequestInit = {}): Promise<any> => {
    ensureAuthenticated();

    const response = await fetch(`${API_URL}/fitness${path}`, {
      ...init,
      headers: {
        ...(authHeaders ?? {}),
        ...(init.headers ?? {}),
      },
    });

    if (!response.ok) {
      let message = 'Fitness request failed';
      try {
        const payload = await response.json();
        if (payload?.error) message = payload.error;
      } catch {
        // no-op
      }

      throw new AppError({
        code: 'UNKNOWN',
        message,
        userMessage: 'No pudimos sincronizar tus datos con el servidor.',
        action: 'Verifica conexion y vuelve a intentar.',
      });
    }

    return response.json();
  }, [authHeaders, ensureAuthenticated]);

  const migrateLegacyData = useCallback(async () => {
    if (!user || !authHeaders) return;
    const flagKey = migrationFlagKey(user.id);
    if (localStorage.getItem(flagKey) === 'done') return;

    const payloads: LocalFitnessPayload[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(LOCAL_DATA_PREFIX)) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = parseLegacyPayload(raw);
      if (parsed) payloads.push(parsed);
    }

    if (payloads.length === 0) {
      localStorage.setItem(flagKey, 'done');
      return;
    }

    const merged = mergeLegacyPayloads(payloads);
    await request('/import', {
      method: 'POST',
      body: JSON.stringify(merged),
    });
    localStorage.setItem(flagKey, 'done');
  }, [authHeaders, request, user]);

  const fetchData = useCallback(async () => {
    if (!user || !authHeaders) {
      setWorkoutLogs([]);
      setBodyWeightLogs([]);
      setWeeklyPlans([]);
      setMacroProfile(null);
      setMealPlans({ ...EMPTY_MEAL_PLANS });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      await migrateLegacyData();

      const [workoutsRes, weightsRes, plansRes, profileRes, mealsRes] = await Promise.all([
        request('/workouts') as Promise<{ data: WorkoutLog[] }>,
        request('/weights') as Promise<{ data: BodyWeightLog[] }>,
        request('/plans') as Promise<{ data: WeeklyPlan[] }>,
        request('/profile') as Promise<{ data: UserMacroProfile | null }>,
        request('/meals') as Promise<{ data: Record<DayOfWeek, Meal[]> }>,
      ]);

      setWorkoutLogs((workoutsRes.data ?? []).map((log) => toDate(log)));
      setBodyWeightLogs((weightsRes.data ?? []).map((log) => toDate(log)));
      setWeeklyPlans((plansRes.data ?? []).map((plan) => ({ ...plan, createdAt: new Date(plan.createdAt) })));
      setMacroProfile(profileRes.data ?? null);
      setMealPlans({ ...EMPTY_MEAL_PLANS, ...(mealsRes.data ?? {}) });
      setError(null);
    } catch (fetchError) {
      const appError = isAppError(fetchError)
        ? fetchError
        : new AppError({
          code: 'UNKNOWN',
          message: 'Unexpected error loading fitness data',
          userMessage: 'No pudimos cargar tus datos del servidor.',
          action: 'Intenta recargar la aplicacion.',
          cause: fetchError,
        });

      setWorkoutLogs([]);
      setBodyWeightLogs([]);
      setWeeklyPlans([]);
      setMacroProfile(null);
      setMealPlans({ ...EMPTY_MEAL_PLANS });
      setError(appError.userMessage);
    } finally {
      setLoading(false);
    }
  }, [authHeaders, migrateLegacyData, request, user]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const addWorkoutLog = async (log: Omit<WorkoutLog, 'id'>) => {
    const payload = { ...log, id: createId('wlog') } as WorkoutLog;
    const response = await request('/workouts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }) as { data: WorkoutLog };
    const created = toDate(response.data);
    setWorkoutLogs((prev) => [created, ...prev]);
    return created;
  };

  const updateWorkoutLog = async (id: string, updates: Partial<WorkoutLog>) => {
    await request(`/workouts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    setWorkoutLogs((prev) => prev.map((log) => (log.id === id ? { ...log, ...updates } : log)));
  };

  const deleteWorkoutLog = async (id: string) => {
    await request(`/workouts/${id}`, { method: 'DELETE' });
    setWorkoutLogs((prev) => prev.filter((log) => log.id !== id));
  };

  const addBodyWeightLog = async (log: Omit<BodyWeightLog, 'id'>) => {
    const payload = { ...log, id: createId('bw') } as BodyWeightLog;
    const response = await request('/weights', {
      method: 'POST',
      body: JSON.stringify(payload),
    }) as { data: BodyWeightLog };
    const created = toDate(response.data);
    setBodyWeightLogs((prev) => [created, ...prev]);
    return created;
  };

  const updateBodyWeightLog = async (id: string, updates: Partial<BodyWeightLog>) => {
    await request(`/weights/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    setBodyWeightLogs((prev) => prev.map((log) => (log.id === id ? { ...log, ...updates } : log)));
  };

  const deleteBodyWeightLog = async (id: string) => {
    await request(`/weights/${id}`, { method: 'DELETE' });
    setBodyWeightLogs((prev) => prev.filter((log) => log.id !== id));
  };

  const saveMacroProfile = async (profile: UserMacroProfile) => {
    const response = await request('/profile', {
      method: 'POST',
      body: JSON.stringify(profile),
    }) as { data: UserMacroProfile };
    setMacroProfile(response.data);
  };

  const saveMealPlan = async (day: DayOfWeek, meals: Meal[]) => {
    await request('/meals', {
      method: 'POST',
      body: JSON.stringify({ day, meals }),
    });
    setMealPlans((prev) => ({ ...prev, [day]: meals }));
  };

  const saveWeeklyPlan = async (plan: Omit<WeeklyPlan, 'id' | 'createdAt'> & { id?: string }) => {
    const payload: WeeklyPlan = {
      ...plan,
      id: plan.id ?? createId('plan'),
      createdAt: plan.id
        ? (weeklyPlans.find((item) => item.id === plan.id)?.createdAt ?? new Date())
        : new Date(),
    };

    const endpoint = plan.id ? `/plans/${plan.id}` : '/plans';
    const method = plan.id ? 'PATCH' : 'POST';
    const response = await request(endpoint, {
      method,
      body: JSON.stringify(payload),
    }) as { data?: WeeklyPlan; success?: boolean };

    const persisted = response.data
      ? { ...response.data, createdAt: new Date(response.data.createdAt) }
      : payload;

    setWeeklyPlans((prev) => {
      if (plan.id) {
        return prev.map((item) => (item.id === plan.id ? persisted : item));
      }
      return [...prev, persisted];
    });

    return persisted;
  };

  const setActivePlan = async (planId: string) => {
    await request(`/plans/${planId}/activate`, { method: 'POST' });
    setWeeklyPlans((prev) => prev.map((plan) => ({ ...plan, isActive: plan.id === planId })));
  };

  return {
    loading,
    error,
    workoutLogs,
    bodyWeightLogs,
    weeklyPlans,
    macroProfile,
    mealPlans,
    addWorkoutLog,
    updateWorkoutLog,
    deleteWorkoutLog,
    addBodyWeightLog,
    updateBodyWeightLog,
    deleteBodyWeightLog,
    saveMacroProfile,
    saveMealPlan,
    saveWeeklyPlan,
    setActivePlan,
    refetch: fetchData,
  };
}
