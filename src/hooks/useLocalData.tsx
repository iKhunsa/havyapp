import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './useAuth';
import type { WorkoutLog, BodyWeightLog, WeeklyPlan, UserMacroProfile, DayOfWeek, Meal } from '@/types/fitness';
import { AppError, isAppError } from '@/lib/app-error';

type LocalFitnessPayload = {
  workoutLogs: WorkoutLog[];
  bodyWeightLogs: BodyWeightLog[];
  weeklyPlans: WeeklyPlan[];
  macroProfile: UserMacroProfile | null;
  mealPlans: Record<DayOfWeek, Meal[]>;
};

const EMPTY_MEAL_PLANS: Record<DayOfWeek, Meal[]> = {
  lunes: [],
  martes: [],
  miercoles: [],
  jueves: [],
  viernes: [],
  sabado: [],
  domingo: [],
};

const createEmptyPayload = (): LocalFitnessPayload => ({
  workoutLogs: [],
  bodyWeightLogs: [],
  weeklyPlans: [],
  macroProfile: null,
  mealPlans: { ...EMPTY_MEAL_PLANS },
});

const dataKeyFor = (userId: string) => `fitness_local_data_v1_${userId}`;

const revivePayload = (raw: string | null): LocalFitnessPayload => {
  if (!raw) return createEmptyPayload();

  try {
    const parsed = JSON.parse(raw) as Partial<LocalFitnessPayload>;

    return {
      workoutLogs: (parsed.workoutLogs ?? []).map((log) => ({
        ...log,
        date: new Date(log.date),
      })),
      bodyWeightLogs: (parsed.bodyWeightLogs ?? []).map((log) => ({
        ...log,
        date: new Date(log.date),
      })),
      weeklyPlans: (parsed.weeklyPlans ?? []).map((plan) => ({
        ...plan,
        createdAt: new Date(plan.createdAt),
      })),
      macroProfile: parsed.macroProfile ?? null,
      mealPlans: {
        ...EMPTY_MEAL_PLANS,
        ...(parsed.mealPlans ?? {}),
      },
    };
  } catch (error) {
    throw new AppError({
      code: 'STORAGE_READ_FAILED',
      message: 'Unable to parse local fitness payload',
      userMessage: 'No pudimos leer los datos guardados en este dispositivo.',
      action: 'Se cargara una version vacia para continuar.',
      cause: error,
    });
  }
};

const createId = (prefix: string) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export function useLocalData() {
  const { user } = useAuth();
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [bodyWeightLogs, setBodyWeightLogs] = useState<BodyWeightLog[]>([]);
  const [weeklyPlans, setWeeklyPlans] = useState<WeeklyPlan[]>([]);
  const [macroProfile, setMacroProfile] = useState<UserMacroProfile | null>(null);
  const [mealPlans, setMealPlans] = useState<Record<DayOfWeek, Meal[]>>({ ...EMPTY_MEAL_PLANS });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const storageKey = useMemo(() => (user ? dataKeyFor(user.id) : null), [user]);

  const persist = useCallback((payload: LocalFitnessPayload) => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (storageError) {
      throw new AppError({
        code: 'STORAGE_WRITE_FAILED',
        message: 'Unable to persist local fitness payload',
        userMessage: 'No pudimos guardar tus cambios en este dispositivo.',
        action: 'Libera espacio del navegador y vuelve a intentar.',
        cause: storageError,
      });
    }
  }, [storageKey]);

  const ensureAuthenticated = useCallback(() => {
    if (!user) {
      throw new AppError({
        code: 'NOT_AUTHENTICATED',
        message: 'Not authenticated',
        userMessage: 'Necesitas iniciar sesion para realizar esta accion.',
        action: 'Inicia sesion y vuelve a intentarlo.',
      });
    }
  }, [user]);

  const fetchData = useCallback(async () => {
    if (!storageKey) {
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
      const payload = revivePayload(localStorage.getItem(storageKey));

      setWorkoutLogs(payload.workoutLogs);
      setBodyWeightLogs(payload.bodyWeightLogs);
      setWeeklyPlans(payload.weeklyPlans);
      setMacroProfile(payload.macroProfile);
      setMealPlans(payload.mealPlans);
      setError(null);
    } catch (fetchError) {
      const appError = isAppError(fetchError)
        ? fetchError
        : new AppError({
          code: 'UNKNOWN',
          message: 'Unexpected error loading fitness data',
          userMessage: 'No pudimos cargar tus datos locales.',
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
  }, [storageKey]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!storageKey || loading) return;

    try {
      persist({
        workoutLogs,
        bodyWeightLogs,
        weeklyPlans,
        macroProfile,
        mealPlans,
      });
      setError(null);
    } catch (persistError) {
      const appError = isAppError(persistError)
        ? persistError
        : new AppError({
          code: 'UNKNOWN',
          message: 'Unexpected error persisting fitness data',
          userMessage: 'No pudimos guardar tus datos locales.',
          action: 'Intenta nuevamente.',
          cause: persistError,
        });

      setError(appError.userMessage);
    }
  }, [storageKey, loading, workoutLogs, bodyWeightLogs, weeklyPlans, macroProfile, mealPlans, persist]);

  const addWorkoutLog = async (log: Omit<WorkoutLog, 'id'>) => {
    ensureAuthenticated();

    const newLog: WorkoutLog = { ...log, id: createId('wlog') };
    setWorkoutLogs((prev) => [newLog, ...prev]);
    return newLog;
  };

  const updateWorkoutLog = async (id: string, updates: Partial<WorkoutLog>) => {
    ensureAuthenticated();
    const exists = workoutLogs.some((log) => log.id === id);
    if (!exists) {
      throw new AppError({
        code: 'RECORD_NOT_FOUND',
        message: `Workout log not found: ${id}`,
        userMessage: 'No encontramos el entrenamiento que querias actualizar.',
        action: 'Recarga la pagina e intenta de nuevo.',
      });
    }
    setWorkoutLogs((prev) => prev.map((log) => (log.id === id ? { ...log, ...updates } : log)));
  };

  const deleteWorkoutLog = async (id: string) => {
    ensureAuthenticated();
    const exists = workoutLogs.some((log) => log.id === id);
    if (!exists) {
      throw new AppError({
        code: 'RECORD_NOT_FOUND',
        message: `Workout log not found: ${id}`,
        userMessage: 'No encontramos el entrenamiento que querias eliminar.',
        action: 'Actualiza la lista e intenta nuevamente.',
      });
    }
    setWorkoutLogs((prev) => prev.filter((log) => log.id !== id));
  };

  const addBodyWeightLog = async (log: Omit<BodyWeightLog, 'id'>) => {
    ensureAuthenticated();

    const newLog: BodyWeightLog = { ...log, id: createId('bw') };
    setBodyWeightLogs((prev) => [newLog, ...prev]);
    return newLog;
  };

  const updateBodyWeightLog = async (id: string, updates: Partial<BodyWeightLog>) => {
    ensureAuthenticated();

    const exists = bodyWeightLogs.some((log) => log.id === id);
    if (!exists) {
      throw new AppError({
        code: 'RECORD_NOT_FOUND',
        message: `Body weight log not found: ${id}`,
        userMessage: 'No encontramos el registro de peso a editar.',
        action: 'Refresca la vista y prueba otra vez.',
      });
    }

    setBodyWeightLogs((prev) => prev.map((log) => (log.id === id ? { ...log, ...updates } : log)));
  };

  const deleteBodyWeightLog = async (id: string) => {
    ensureAuthenticated();

    const exists = bodyWeightLogs.some((log) => log.id === id);
    if (!exists) {
      throw new AppError({
        code: 'RECORD_NOT_FOUND',
        message: `Body weight log not found: ${id}`,
        userMessage: 'No encontramos el registro de peso a eliminar.',
        action: 'Refresca la vista e intenta nuevamente.',
      });
    }

    setBodyWeightLogs((prev) => prev.filter((log) => log.id !== id));
  };

  const saveMacroProfile = async (profile: UserMacroProfile) => {
    ensureAuthenticated();

    if (profile.weight <= 0 || profile.height <= 0 || profile.age <= 0) {
      throw new AppError({
        code: 'INVALID_INPUT',
        message: 'Invalid macro profile input',
        userMessage: 'Los datos del perfil son invalidos.',
        action: 'Verifica peso, altura y edad antes de guardar.',
      });
    }

    setMacroProfile(profile);
  };

  const saveMealPlan = async (day: DayOfWeek, meals: Meal[]) => {
    ensureAuthenticated();

    if (!Array.isArray(meals)) {
      throw new AppError({
        code: 'INVALID_INPUT',
        message: `Invalid meal plan payload for ${day}`,
        userMessage: 'No se pudo guardar el plan de comidas.',
        action: 'Intenta nuevamente en unos segundos.',
      });
    }

    setMealPlans((prev) => ({ ...prev, [day]: meals }));
  };

  const saveWeeklyPlan = async (plan: Omit<WeeklyPlan, 'id' | 'createdAt'> & { id?: string }) => {
    ensureAuthenticated();

    if (!plan.name?.trim()) {
      throw new AppError({
        code: 'INVALID_INPUT',
        message: 'Weekly plan requires a valid name',
        userMessage: 'El plan semanal necesita un nombre.',
        action: 'Asigna un nombre y vuelve a guardar.',
      });
    }

    if (plan.id) {
      const exists = weeklyPlans.some((item) => item.id === plan.id);
      if (!exists) {
        throw new AppError({
          code: 'RECORD_NOT_FOUND',
          message: `Weekly plan not found: ${plan.id}`,
          userMessage: 'No encontramos el plan semanal a actualizar.',
          action: 'Refresca la vista y vuelve a intentar.',
        });
      }

      const updatedPlan = { ...plan } as WeeklyPlan;
      setWeeklyPlans((prev) => prev.map((item) => (item.id === plan.id ? { ...item, ...updatedPlan } : item)));
      return updatedPlan;
    }

    const newPlan: WeeklyPlan = {
      ...plan,
      id: createId('plan'),
      createdAt: new Date(),
    };
    setWeeklyPlans((prev) => [...prev, newPlan]);
    return newPlan;
  };

  const setActivePlan = async (planId: string) => {
    ensureAuthenticated();

    const exists = weeklyPlans.some((plan) => plan.id === planId);
    if (!exists) {
      throw new AppError({
        code: 'RECORD_NOT_FOUND',
        message: `Weekly plan not found: ${planId}`,
        userMessage: 'No encontramos el plan que intentaste activar.',
        action: 'Actualiza la pantalla y vuelve a intentar.',
      });
    }

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
