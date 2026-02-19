import type { DayOfWeek, MuscleGroup, WorkoutLog } from '@/types/fitness';

type Language = 'es' | 'en';

const DAYS_ES: Record<number, DayOfWeek> = {
  0: 'domingo',
  1: 'lunes',
  2: 'martes',
  3: 'miercoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sabado',
};

export const getCurrentDay = (): DayOfWeek => {
  return DAYS_ES[new Date().getDay()];
};

export const getDayLabel = (day: DayOfWeek, language: Language = 'es'): string => {
  const labelsEs: Record<DayOfWeek, string> = {
    lunes: 'LUN',
    martes: 'MAR',
    miercoles: 'MIE',
    jueves: 'JUE',
    viernes: 'VIE',
    sabado: 'SAB',
    domingo: 'DOM',
  };

  const labelsEn: Record<DayOfWeek, string> = {
    lunes: 'MON',
    martes: 'TUE',
    miercoles: 'WED',
    jueves: 'THU',
    viernes: 'FRI',
    sabado: 'SAT',
    domingo: 'SUN',
  };

  return language === 'es' ? labelsEs[day] : labelsEn[day];
};

export const getMuscleGroupLabel = (group: MuscleGroup, language: Language = 'es'): string => {
  const labelsEs: Record<MuscleGroup, string> = {
    pecho: 'Pecho',
    espalda: 'Espalda',
    hombros: 'Hombros',
    biceps: 'Bíceps',
    triceps: 'Tríceps',
    piernas: 'Piernas',
    gluteos: 'Glúteos',
    core: 'Core',
    cardio: 'Cardio',
    descanso: 'Descanso',
  };

  const labelsEn: Record<MuscleGroup, string> = {
    pecho: 'Chest',
    espalda: 'Back',
    hombros: 'Shoulders',
    biceps: 'Biceps',
    triceps: 'Triceps',
    piernas: 'Legs',
    gluteos: 'Glutes',
    core: 'Core',
    cardio: 'Cardio',
    descanso: 'Rest',
  };

  return language === 'es' ? labelsEs[group] : labelsEn[group];
};

// Calculate days since last workout for a muscle group
export const daysSinceLastStimulus = (
  muscleGroup: MuscleGroup,
  workoutLogs: WorkoutLog[]
): number => {
  const relevantLogs = workoutLogs.filter(log => 
    log.muscleGroups && log.muscleGroups.includes(muscleGroup)
  );
  if (relevantLogs.length === 0) return 999;
  
  const lastWorkout = relevantLogs.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0];
  
  const daysDiff = Math.floor(
    (Date.now() - new Date(lastWorkout.date).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return daysDiff;
};

// Anti-ego detection: check if progression is too fast
export const detectEgoProgression = (
  exerciseId: string,
  currentWeight: number,
  workoutLogs: WorkoutLog[]
): { isEgo: boolean; message?: string } => {
  const exerciseLogs = workoutLogs
    .filter(log => log.exerciseId === exerciseId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  if (exerciseLogs.length < 2) return { isEgo: false };
  
  const lastWeight = exerciseLogs[0].sets[0]?.weight || 0;
  const progressPercent = ((currentWeight - lastWeight) / lastWeight) * 100;
  
  if (progressPercent > 10) {
    return {
      isEgo: true,
      message: `Aumento de ${progressPercent.toFixed(1)}% detectado. Riesgo de ego lifting.`
    };
  }
  
  return { isEgo: false };
};

// Stagnation detection
export const detectStagnation = (
  exerciseId: string,
  workoutLogs: WorkoutLog[]
): { isStagnant: boolean; weeks?: number } => {
  const exerciseLogs = workoutLogs
    .filter(log => log.exerciseId === exerciseId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);
  
  if (exerciseLogs.length < 3) return { isStagnant: false };
  
  const weights = exerciseLogs.map(log => log.sets[0]?.weight || 0);
  const allSame = weights.every(w => w === weights[0]);
  
  if (allSame) {
    return {
      isStagnant: true,
      weeks: exerciseLogs.length
    };
  }
  
  return { isStagnant: false };
};

export const formatDate = (date: Date, language: Language = 'es'): string => {
  return new Intl.DateTimeFormat(language === 'es' ? 'es-ES' : 'en-US', {
    day: 'numeric',
    month: 'short',
  }).format(date);
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
