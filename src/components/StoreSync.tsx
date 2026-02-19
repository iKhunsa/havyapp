import { useEffect } from 'react';
import { useData } from '@/hooks/useData';
import { useFitnessStore } from '@/stores/fitnessStore';
import type { DayMealPlan } from '@/types/fitness';

const DAYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] as const;

export function StoreSync() {
  const { workoutLogs, bodyWeightLogs, weeklyPlans, macroProfile, mealPlans } = useData();

  useEffect(() => {
    const mealPlanList: DayMealPlan[] = DAYS.map((day) => ({
      day,
      meals: mealPlans[day] ?? [],
    }));

    useFitnessStore.setState((state) => ({
      ...state,
      workoutLogs,
      bodyWeightLogs,
      weeklyPlans,
      macroProfile,
      mealPlans: mealPlanList,
      activePlanId:
        weeklyPlans.find((plan) => plan.isActive)?.id ??
        weeklyPlans[0]?.id ??
        state.activePlanId,
    }));
  }, [workoutLogs, bodyWeightLogs, weeklyPlans, macroProfile, mealPlans]);

  return null;
}
